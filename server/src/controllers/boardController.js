const Board = require("../models/Board");
const Classroom = require("../models/Classroom");
const { asyncHandler } = require("../middleware/errorHandler");
const { isMember } = require("./classroomController");

const DRAW_TYPES = new Set(["CREATE", "DRAW", "UPDATE", "DELETE", "CLEAR"]);
const TEACHER_ONLY = new Set(["LOCK_STUDENTS", "CHANGE_PAGE", "ADD_PAGE", "END_CLASS", "REOPEN_CLASS"]);

async function loadClassroomForUser(classroomId, user) {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    const err = Object.assign(new Error("Classroom not found."), { statusCode: 404 });
    throw err;
  }
  if (!isMember(classroom, user._id)) {
    const err = Object.assign(new Error("You are not a member of this classroom."), {
      statusCode: 403,
    });
    throw err;
  }
  return classroom;
}

function isClassroomTeacher(classroom, user) {
  return String(classroom.teacher) === String(user._id) || user.role === "teacher";
}

function sanitizeObject(obj, userId) {
  if (!obj || typeof obj !== "object") return null;
  const id = String(obj.id || "").trim();
  if (!id) return null;
  return {
    id,
    type: String(obj.type || "path"),
    x: Number(obj.x) || 0,
    y: Number(obj.y) || 0,
    width: Number(obj.width) || 0,
    height: Number(obj.height) || 0,
    rotation: Number(obj.rotation) || 0,
    zIndex: Number(obj.zIndex) || 0,
    style: obj.style && typeof obj.style === "object" ? obj.style : {},
    data: obj.data && typeof obj.data === "object" ? obj.data : {},
    createdBy: obj.createdBy || userId,
    pageNumber: Number(obj.pageNumber) || 1,
    deleted: Boolean(obj.deleted),
    version: Number(obj.version) || 1,
  };
}

function boardSummary(board) {
  const b = typeof board.toObject === "function" ? board.toObject() : board;
  return {
    _id: b._id,
    classroom: b.classroom,
    title: b.title,
    createdBy: b.createdBy,
    studentEditingLocked: b.studentEditingLocked,
    liveEnded: Boolean(b.liveEnded),
    endedAt: b.endedAt || null,
    currentPage: b.currentPage,
    version: b.version,
    pages: b.pages || [],
    objectCount: (b.objects || []).filter((o) => !o.deleted).length,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

function boardState(board) {
  const b = typeof board.toObject === "function" ? board.toObject() : board;
  return {
    ...boardSummary(b),
    objects: (b.objects || []).filter((o) => !o.deleted),
  };
}

function canStudentEdit(board, user, classroom) {
  if (isClassroomTeacher(classroom, user)) return true;
  return !board.studentEditingLocked;
}

async function applyOperationToBoard(boardId, user, operation) {
  const board = await Board.findById(boardId);
  if (!board) {
    const err = Object.assign(new Error("Board not found."), { statusCode: 404 });
    throw err;
  }

  const classroom = await Classroom.findById(board.classroom);
  if (!classroom || !isMember(classroom, user._id)) {
    const err = Object.assign(new Error("You are not a member of this classroom."), {
      statusCode: 403,
    });
    throw err;
  }

  const type = String(operation?.type || "").toUpperCase();
  if (!type) {
    const err = Object.assign(new Error("Operation type is required."), { statusCode: 400 });
    throw err;
  }

  if (type === "RAISE_HAND") {
    if (board.liveEnded) {
      const err = Object.assign(new Error("This live class has ended."), { statusCode: 403 });
      throw err;
    }
    board.version += 1;
    await board.save();
    return {
      board: boardState(board),
      operation: {
        type: "RAISE_HAND",
        userId: String(user._id),
        userName: user.name,
        at: new Date().toISOString(),
      },
    };
  }

  const teacher = isClassroomTeacher(classroom, user);
  if (!teacher && TEACHER_ONLY.has(type)) {
    const err = Object.assign(new Error("Only teachers can do that."), { statusCode: 403 });
    throw err;
  }

  if (board.liveEnded && type !== "REOPEN_CLASS") {
    const err = Object.assign(new Error("This live class has ended."), { statusCode: 403 });
    throw err;
  }

  if (DRAW_TYPES.has(type) && !canStudentEdit(board, user, classroom)) {
    const err = Object.assign(new Error("Students are locked from editing."), { statusCode: 403 });
    throw err;
  }

  if (type === "CREATE" || type === "DRAW") {
    const obj = sanitizeObject(operation.object || operation.payload, user._id);
    if (!obj) {
      const err = Object.assign(new Error("Object payload required."), { statusCode: 400 });
      throw err;
    }
    const idx = board.objects.findIndex((o) => o.id === obj.id);
    if (idx >= 0) board.objects[idx] = obj;
    else board.objects.push(obj);
  } else if (type === "UPDATE") {
    const patch = operation.object || operation.payload || {};
    const id = String(patch.id || operation.objectId || "").trim();
    const idx = board.objects.findIndex((o) => o.id === id);
    if (idx < 0) {
      const err = Object.assign(new Error("Object not found."), { statusCode: 404 });
      throw err;
    }
    const current = board.objects[idx].toObject ? board.objects[idx].toObject() : { ...board.objects[idx] };
    const merged = sanitizeObject({ ...current, ...patch, id }, current.createdBy || user._id);
    merged.version = (current.version || 1) + 1;
    board.objects[idx] = merged;
  } else if (type === "DELETE") {
    const id = String(operation.objectId || operation.object?.id || "").trim();
    const idx = board.objects.findIndex((o) => o.id === id);
    if (idx >= 0) {
      board.objects[idx].deleted = true;
      board.objects[idx].version = (board.objects[idx].version || 1) + 1;
    }
  } else if (type === "CLEAR") {
    const pageNumber = Number(operation.pageNumber || board.currentPage) || 1;
    board.objects.forEach((o) => {
      if (o.pageNumber === pageNumber && !o.deleted) {
        o.deleted = true;
        o.version = (o.version || 1) + 1;
      }
    });
  } else if (type === "LOCK_STUDENTS") {
    board.studentEditingLocked = operation.locked !== undefined ? Boolean(operation.locked) : !board.studentEditingLocked;
  } else if (type === "CHANGE_PAGE") {
    const pageNumber = Number(operation.pageNumber);
    if (!pageNumber || !board.pages.some((p) => p.pageNumber === pageNumber)) {
      const err = Object.assign(new Error("Invalid page."), { statusCode: 400 });
      throw err;
    }
    board.currentPage = pageNumber;
  } else if (type === "ADD_PAGE") {
    const nextNum = board.pages.reduce((max, p) => Math.max(max, p.pageNumber), 0) + 1;
    board.pages.push({
      pageNumber: nextNum,
      title: operation.title || `Page ${nextNum}`,
      backgroundColor: operation.backgroundColor || "#0B1824",
    });
    board.currentPage = nextNum;
  } else if (type === "END_CLASS") {
    board.liveEnded = true;
    board.endedAt = new Date();
    board.endedBy = user._id;
    board.studentEditingLocked = true;
  } else if (type === "REOPEN_CLASS") {
    board.liveEnded = false;
    board.endedAt = undefined;
    board.endedBy = undefined;
    board.studentEditingLocked = true;
  } else {
    const err = Object.assign(new Error(`Unknown operation: ${type}`), { statusCode: 400 });
    throw err;
  }

  board.version += 1;
  await board.save();

  return {
    board: boardState(board),
    operation: {
      ...operation,
      type,
      version: board.version,
      userId: String(user._id),
      userName: user.name,
      at: new Date().toISOString(),
    },
  };
}

const createBoard = asyncHandler(async (req, res) => {
  const classroomId = req.body.classroomId;
  const title = (req.body.title || "Whiteboard").trim() || "Whiteboard";
  if (!classroomId) return res.status(400).json({ message: "classroomId is required." });

  const classroom = await loadClassroomForUser(classroomId, req.user);
  if (String(classroom.teacher) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only the classroom teacher can create boards." });
  }

  const board = await Board.create({
    classroom: classroomId,
    title,
    createdBy: req.user._id,
    studentEditingLocked: true,
    liveEnded: false,
    currentPage: 1,
    version: 0,
    pages: [{ pageNumber: 1, title: "Page 1", backgroundColor: "#0B1824" }],
    objects: [],
  });

  res.status(201).json({ board: boardSummary(board) });
});

const listBoards = asyncHandler(async (req, res) => {
  const classroomId = req.query.classroomId;
  if (!classroomId) return res.status(400).json({ message: "classroomId is required." });
  await loadClassroomForUser(classroomId, req.user);

  const boards = await Board.find({ classroom: classroomId })
    .sort({ updatedAt: -1 })
    .select("-objects")
    .lean();

  res.json({
    boards: boards.map((b) => ({
      ...boardSummary(b),
      objectCount: undefined,
    })),
  });
});

const getBoard = asyncHandler(async (req, res) => {
  const board = await Board.findById(req.params.id).select("-objects");
  if (!board) return res.status(404).json({ message: "Board not found." });
  await loadClassroomForUser(board.classroom, req.user);
  res.json({ board: boardSummary(board) });
});

const getBoardState = asyncHandler(async (req, res) => {
  const board = await Board.findById(req.params.id);
  if (!board) return res.status(404).json({ message: "Board not found." });
  await loadClassroomForUser(board.classroom, req.user);
  res.json({ board: boardState(board) });
});

const saveSnapshot = asyncHandler(async (req, res) => {
  const board = await Board.findById(req.params.id);
  if (!board) return res.status(404).json({ message: "Board not found." });
  const classroom = await loadClassroomForUser(board.classroom, req.user);

  if (!canStudentEdit(board, req.user, classroom)) {
    return res.status(403).json({ message: "Students are locked from editing." });
  }

  const objects = Array.isArray(req.body.objects) ? req.body.objects : null;
  if (!objects) return res.status(400).json({ message: "objects array is required." });

  board.objects = objects
    .map((o) => sanitizeObject(o, req.user._id))
    .filter(Boolean);
  board.updatedAt = new Date();
  await board.save();

  res.json({ board: boardState(board) });
});

const applyOperation = asyncHandler(async (req, res) => {
  const result = await applyOperationToBoard(req.params.id, req.user, req.body);
  res.json(result);
});

const endLiveClass = asyncHandler(async (req, res) => {
  const result = await applyOperationToBoard(req.params.id, req.user, { type: "END_CLASS" });
  res.json(result);
});

const reopenLiveClass = asyncHandler(async (req, res) => {
  const result = await applyOperationToBoard(req.params.id, req.user, { type: "REOPEN_CLASS" });
  res.json(result);
});

module.exports = {
  createBoard,
  listBoards,
  getBoard,
  getBoardState,
  saveSnapshot,
  applyOperation,
  endLiveClass,
  reopenLiveClass,
  applyOperationToBoard,
  boardState,
  boardSummary,
};
