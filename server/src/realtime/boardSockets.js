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
  /** @type {Map<string, Map<string, { userId: string, audio: boolean, video: boolean, socketId: string }>>} */
  const callByBoard = new Map();

  function getPresence(boardId) {
    if (!presenceByBoard.has(boardId)) presenceByBoard.set(boardId, new Map());
    return presenceByBoard.get(boardId);
  }

  function getCall(boardId) {
    if (!callByBoard.has(boardId)) callByBoard.set(boardId, new Map());
    return callByBoard.get(boardId);
  }

  function emitPresence(boardId) {
    const map = getPresence(boardId);
    const users = Array.from(map.values());
    io.to(roomName(boardId)).emit("board:presence", { boardId, users });
  }

  function relayToUser(boardId, targetUserId, event, payload) {
    const presence = getPresence(boardId);
    const entry = presence.get(String(targetUserId));
    if (entry?.socketId) {
      io.to(entry.socketId).emit(event, payload);
      return;
    }
    // Fallback: anyone still in the room matching target (rare race)
    for (const [uid, p] of presence.entries()) {
      if (uid === String(targetUserId) && p.socketId) {
        io.to(p.socketId).emit(event, payload);
      }
    }
  }

  function leaveCall(boardId, userId) {
    if (!boardId) return;
    const call = getCall(boardId);
    if (!call.has(String(userId))) return;
    call.delete(String(userId));
    io.to(roomName(boardId)).emit("webrtc:peer-left", {
      boardId: String(boardId),
      userId: String(userId),
    });
    if (call.size === 0) callByBoard.delete(boardId);
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
          leaveCall(joinedBoardId, socket.user._id);
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
      leaveCall(joinedBoardId, socket.user._id);
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

        const boardPayload = {
          version: result.board.version,
          studentEditingLocked: result.board.studentEditingLocked,
          currentPage: result.board.currentPage,
          pages: result.board.pages,
          liveEnded: Boolean(result.board.liveEnded),
          endedAt: result.board.endedAt || null,
        };

        socket.to(roomName(String(boardId))).emit("board:operation", {
          boardId: String(boardId),
          operation: result.operation,
          board: boardPayload,
        });

        if (result.operation?.type === "END_CLASS") {
          io.to(roomName(String(boardId))).emit("board:ended", {
            boardId: String(boardId),
            endedBy: String(socket.user._id),
            endedByName: socket.user.name,
            endedAt: result.board.endedAt,
            board: boardPayload,
          });
          // Drop everyone from A/V + room presence after a short broadcast window
          const presence = getPresence(String(boardId));
          presence.clear();
          emitPresence(String(boardId));
        }

        if (result.operation?.type === "REOPEN_CLASS") {
          io.to(roomName(String(boardId))).emit("board:reopened", {
            boardId: String(boardId),
            board: boardPayload,
          });
        }

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

    socket.on("webrtc:ready", (payload) => {
      const boardId = String(payload?.boardId || joinedBoardId || "");
      if (!boardId || boardId !== joinedBoardId) return;
      const userId = String(socket.user._id);
      const audio = payload?.audio !== false;
      const video = payload?.video !== false;
      const call = getCall(boardId);
      const peersInCall = Array.from(call.values()).filter((p) => p.userId !== userId);
      call.set(userId, {
        userId,
        audio,
        video,
        socketId: socket.id,
      });
      socket.to(roomName(boardId)).emit("webrtc:ready", {
        boardId,
        userId,
        name: socket.user.name,
        audio,
        video,
        peersInCall,
      });
      // Ack-style self notice with who is already in the call
      socket.emit("webrtc:ready", {
        boardId,
        userId,
        name: socket.user.name,
        audio,
        video,
        peersInCall,
        self: true,
      });
    });

    socket.on("webrtc:leave", (payload) => {
      const boardId = String(payload?.boardId || joinedBoardId || "");
      if (!boardId) return;
      leaveCall(boardId, socket.user._id);
    });

    socket.on("webrtc:offer", (payload) => {
      const boardId = String(payload?.boardId || joinedBoardId || "");
      const targetUserId = payload?.targetUserId;
      if (!boardId || !targetUserId || !payload?.sdp) return;
      relayToUser(boardId, targetUserId, "webrtc:offer", {
        boardId,
        fromUserId: String(socket.user._id),
        fromName: socket.user.name,
        targetUserId: String(targetUserId),
        sdp: payload.sdp,
      });
    });

    socket.on("webrtc:answer", (payload) => {
      const boardId = String(payload?.boardId || joinedBoardId || "");
      const targetUserId = payload?.targetUserId;
      if (!boardId || !targetUserId || !payload?.sdp) return;
      relayToUser(boardId, targetUserId, "webrtc:answer", {
        boardId,
        fromUserId: String(socket.user._id),
        fromName: socket.user.name,
        targetUserId: String(targetUserId),
        sdp: payload.sdp,
      });
    });

    socket.on("webrtc:ice", (payload) => {
      const boardId = String(payload?.boardId || joinedBoardId || "");
      const targetUserId = payload?.targetUserId;
      if (!boardId || !targetUserId || !payload?.candidate) return;
      relayToUser(boardId, targetUserId, "webrtc:ice", {
        boardId,
        fromUserId: String(socket.user._id),
        targetUserId: String(targetUserId),
        candidate: payload.candidate,
      });
    });

    socket.on("webrtc:state", (payload) => {
      const boardId = String(payload?.boardId || joinedBoardId || "");
      if (!boardId || boardId !== joinedBoardId) return;
      const userId = String(socket.user._id);
      const audio = Boolean(payload?.audio);
      const video = Boolean(payload?.video);
      const call = getCall(boardId);
      const entry = call.get(userId);
      if (entry) {
        entry.audio = audio;
        entry.video = video;
        call.set(userId, entry);
      }
      io.to(roomName(boardId)).emit("webrtc:state", {
        boardId,
        userId,
        audio,
        video,
      });
    });

    socket.on("disconnect", () => {
      if (!joinedBoardId) return;
      leaveCall(joinedBoardId, socket.user._id);
      const presence = getPresence(joinedBoardId);
      presence.delete(String(socket.user._id));
      emitPresence(joinedBoardId);
      joinedBoardId = null;
    });
  });

  return io;
}

module.exports = { setupBoardSockets };
