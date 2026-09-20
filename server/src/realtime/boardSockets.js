const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("../models/User");
const Board = require("../models/Board");
const Classroom = require("../models/Classroom");
const { isMember } = require("../controllers/classroomController");
const { applyOperationToBoard } = require("../controllers/boardController");

function roomName(boardId) {
  return `board:${boardId}`;
}

function setupBoardSockets(httpServer, corsOriginFn) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOriginFn,
      credentials: true,
    },
    path: "/socket.io",
  });

  const presenceByBoard = new Map();

  function getPresence(boardId) {
    if (!presenceByBoard.has(boardId)) presenceByBoard.set(boardId, new Map());
    return presenceByBoard.get(boardId);
  }

  function emitPresence(boardId) {
    const map = getPresence(boardId);
    const users = Array.from(map.values());
    io.to(roomName(boardId)).emit("board:presence", { boardId, users });
  }

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (socket.handshake.headers?.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token) return next(new Error("Not authenticated."));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id);
      if (!user) return next(new Error("User no longer exists."));
      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", (socket) => {
    let joinedBoardId = null;

    socket.on("board:join", async (payload, ack) => {
      try {
        const boardId = payload?.boardId || payload;
        if (!boardId) throw Object.assign(new Error("boardId required"), { statusCode: 400 });

        const board = await Board.findById(boardId).select("classroom");
        if (!board) throw Object.assign(new Error("Board not found."), { statusCode: 404 });
        const classroom = await Classroom.findById(board.classroom);
        if (!classroom || !isMember(classroom, socket.user._id)) {
          throw Object.assign(new Error("Not a classroom member."), { statusCode: 403 });
        }

        if (joinedBoardId) {
          socket.leave(roomName(joinedBoardId));
          const prev = getPresence(joinedBoardId);
          prev.delete(String(socket.user._id));
          emitPresence(joinedBoardId);
        }

        joinedBoardId = String(boardId);
        socket.join(roomName(joinedBoardId));

        const presence = getPresence(joinedBoardId);
        presence.set(String(socket.user._id), {
          userId: String(socket.user._id),
          name: socket.user.name,
          role: socket.user.role,
          handRaised: false,
          cursor: null,
          socketId: socket.id,
        });
        emitPresence(joinedBoardId);

        if (typeof ack === "function") ack({ ok: true, boardId: joinedBoardId });
      } catch (err) {
        if (typeof ack === "function") {
          ack({ ok: false, message: err.message || "Join failed." });
        }
      }
    });

    socket.on("board:leave", () => {
      if (!joinedBoardId) return;
      socket.leave(roomName(joinedBoardId));
      const presence = getPresence(joinedBoardId);
      presence.delete(String(socket.user._id));
      emitPresence(joinedBoardId);
      joinedBoardId = null;
    });

    socket.on("board:operation", async (payload, ack) => {
      try {
        const boardId = payload?.boardId || joinedBoardId;
        if (!boardId) throw new Error("boardId required");
        const operation = payload?.operation || payload;
        const result = await applyOperationToBoard(boardId, socket.user, operation);

        if (result.operation?.type === "RAISE_HAND") {
          const presence = getPresence(String(boardId));
          const entry = presence.get(String(socket.user._id));
          if (entry) {
            entry.handRaised = true;
            presence.set(String(socket.user._id), entry);
            emitPresence(String(boardId));
          }
        }

        socket.to(roomName(String(boardId))).emit("board:operation", {
          boardId: String(boardId),
          operation: result.operation,
          board: {
            version: result.board.version,
            studentEditingLocked: result.board.studentEditingLocked,
            currentPage: result.board.currentPage,
            pages: result.board.pages,
          },
        });

        if (typeof ack === "function") ack({ ok: true, ...result });
      } catch (err) {
        if (typeof ack === "function") {
          ack({ ok: false, message: err.message || "Operation failed." });
        }
      }
    });

    socket.on("board:cursor", (payload) => {
      if (!joinedBoardId) return;
      const presence = getPresence(joinedBoardId);
      const entry = presence.get(String(socket.user._id));
      if (entry) {
        entry.cursor = payload?.cursor || { x: payload?.x, y: payload?.y };
        presence.set(String(socket.user._id), entry);
      }
      socket.to(roomName(joinedBoardId)).emit("board:cursor", {
        boardId: joinedBoardId,
        userId: String(socket.user._id),
        name: socket.user.name,
        cursor: payload?.cursor || { x: payload?.x, y: payload?.y },
      });
    });

    socket.on("board:viewport", (payload) => {
      if (!joinedBoardId) return;
      socket.to(roomName(joinedBoardId)).emit("board:viewport", {
        boardId: joinedBoardId,
        userId: String(socket.user._id),
        viewport: payload?.viewport || payload,
      });
    });

    socket.on("disconnect", () => {
      if (!joinedBoardId) return;
      const presence = getPresence(joinedBoardId);
      presence.delete(String(socket.user._id));
      emitPresence(joinedBoardId);
      joinedBoardId = null;
    });
  });

  return io;
}

module.exports = { setupBoardSockets };
