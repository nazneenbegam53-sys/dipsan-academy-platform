import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Stage, Layer, Line, Rect, Circle, Arrow, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { boardApi, connectBoardSocket } from "../services/classroomApi";
import type {
  Board,
  PresenceUser,
  WhiteboardObject,
  WhiteboardTool,
} from "../types";
import { Button, ErrorBanner, Spinner, PageShell } from "../components/ui";
import CallDock from "../components/classroom/CallDock";
import { getToken } from "../services/api";

const TOOLS: { id: WhiteboardTool; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "pen", label: "Pen" },
  { id: "highlighter", label: "Highlight" },
  { id: "eraser", label: "Eraser" },
  { id: "line", label: "Line" },
  { id: "arrow", label: "Arrow" },
  { id: "rect", label: "Rect" },
  { id: "circle", label: "Circle" },
  { id: "text", label: "Text" },
  { id: "pan", label: "Pan" },
];

function uid() {
  return `obj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function cloneObjects(objs: WhiteboardObject[]) {
  return objs.map((o) => ({ ...o, style: { ...o.style }, data: { ...o.data } }));
}

export default function WhiteboardSession() {
  const { boardId = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === "teacher";
  const home = "/classroom";

  const [board, setBoard] = useState<Board | null>(null);
  const [objects, setObjects] = useState<WhiteboardObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tool, setTool] = useState<WhiteboardTool>("pen");
  const [color, setColor] = useState("#F0E0B8");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<
    Record<string, { name: string; x: number; y: number }>
  >({});
  const [stageSize, setStageSize] = useState({ width: 900, height: 560 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [endingClass, setEndingClass] = useState(false);
  const [endedBanner, setEndedBanner] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);

  const historyRef = useRef<WhiteboardObject[][]>([]);
  const futureRef = useRef<WhiteboardObject[][]>([]);
  const drawingRef = useRef<WhiteboardObject | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const objectsRef = useRef(objects);
  const skipEmitRef = useRef(false);

  objectsRef.current = objects;

  const lockedForStudent = Boolean(board?.studentEditingLocked && !isTeacher);
  const classEnded = Boolean(board?.liveEnded);
  const canEdit = !lockedForStudent && !classEnded;

  const pageObjects = useMemo(
    () => objects.filter((o) => !o.deleted && o.pageNumber === page).sort((a, b) => a.zIndex - b.zIndex),
    [objects, page]
  );

  const pushHistory = useCallback((next: WhiteboardObject[]) => {
    historyRef.current.push(cloneObjects(objectsRef.current));
    if (historyRef.current.length > 40) historyRef.current.shift();
    futureRef.current = [];
    setObjects(next);
  }, []);

  const emitOperation = useCallback(
    (operation: Record<string, unknown>) => {
      if (skipEmitRef.current) return;
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit("board:operation", { boardId, operation });
      } else {
        boardApi.operate(boardId, operation).catch(() => {});
      }
    },
    [boardId]
  );

  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    boardApi
      .state(boardId)
      .then((r) => {
        setBoard(r.board);
        setObjects(r.board.objects || []);
        setPage(r.board.currentPage || 1);
      })
      .catch((err) => setError(err.message || "Could not load board."))
      .finally(() => setLoading(false));
  }, [boardId]);

  useEffect(() => {
    if (!boardId || !user) return;
    const s = connectBoardSocket(boardId, getToken());
    socketRef.current = s;
    setSocket(s);

    s.on("board:presence", (payload: { users: PresenceUser[] }) => {
      setPresence(payload.users || []);
    });

    s.on("board:cursor", (payload: { userId: string; name: string; cursor: { x: number; y: number } }) => {
      if (!payload?.userId || payload.userId === user.id) return;
      setRemoteCursors((prev) => ({
        ...prev,
        [payload.userId]: {
          name: payload.name,
          x: payload.cursor?.x ?? 0,
          y: payload.cursor?.y ?? 0,
        },
      }));
    });

    s.on(
      "board:operation",
      (payload: {
        operation: Record<string, unknown>;
        board?: Partial<Board>;
      }) => {
        if (payload.operation?.userId === user.id) return;
        skipEmitRef.current = true;
        try {
          applyRemoteOperation(payload.operation);
          if (payload.board) {
            setBoard((b) => (b ? { ...b, ...payload.board } : b));
            if (payload.board.currentPage) setPage(payload.board.currentPage);
          }
        } finally {
          skipEmitRef.current = false;
        }
      }
    );

    s.on(
      "board:ended",
      (payload: { endedByName?: string; board?: Partial<Board> }) => {
        if (payload.board) {
          setBoard((b) => (b ? { ...b, ...payload.board, liveEnded: true } : b));
        } else {
          setBoard((b) => (b ? { ...b, liveEnded: true, studentEditingLocked: true } : b));
        }
        setEndedBanner(
          payload.endedByName
            ? `${payload.endedByName} ended the live class.`
            : "The teacher ended the live class."
        );
        setSelectedId(null);
      }
    );

    s.on("board:reopened", (payload: { board?: Partial<Board> }) => {
      if (payload.board) {
        setBoard((b) => (b ? { ...b, ...payload.board, liveEnded: false } : b));
      } else {
        setBoard((b) => (b ? { ...b, liveEnded: false } : b));
      }
      setEndedBanner("");
    });

    return () => {
      s.emit("board:leave");
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, user?.id]);

  useEffect(() => {
    function resize() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setStageSize({
        width: Math.max(320, rect.width),
        height: Math.max(360, window.innerHeight - (window.innerWidth < 768 ? 220 : 180)),
      });
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [loading]);

  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const node = selectedId ? stage.findOne(`#${selectedId}`) : null;
    if (node) {
      tr.nodes([node as Konva.Node]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
    }
  }, [selectedId, pageObjects]);

  useEffect(() => {
    if (!boardId || !canEdit) return;
    const timer = setInterval(() => {
      setSaving(true);
      boardApi
        .snapshot(boardId, objectsRef.current)
        .then((r) => setBoard((b) => (b ? { ...b, version: r.board.version, updatedAt: r.board.updatedAt } : b)))
        .catch(() => {})
        .finally(() => setSaving(false));
    }, 8000);
    return () => clearInterval(timer);
  }, [boardId, canEdit]);

  function applyRemoteOperation(op: Record<string, unknown>) {
    const type = String(op.type || "").toUpperCase();
    if (type === "CREATE" || type === "DRAW") {
      const obj = (op.object || op.payload) as WhiteboardObject | undefined;
      if (!obj?.id) return;
      setObjects((prev) => {
        const idx = prev.findIndex((o) => o.id === obj.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...obj };
          return next;
        }
        return [...prev, obj];
      });
    } else if (type === "UPDATE") {
      const patch = (op.object || op.payload || {}) as WhiteboardObject;
      const id = String(patch.id || op.objectId || "");
      setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    } else if (type === "DELETE") {
      const id = String(op.objectId || (op.object as WhiteboardObject)?.id || "");
      setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, deleted: true } : o)));
    } else if (type === "CLEAR") {
      const pageNumber = Number(op.pageNumber || page);
      setObjects((prev) =>
        prev.map((o) => (o.pageNumber === pageNumber ? { ...o, deleted: true } : o))
      );
    } else if (type === "LOCK_STUDENTS") {
      setBoard((b) =>
        b
          ? {
              ...b,
              studentEditingLocked:
                op.locked !== undefined ? Boolean(op.locked) : !b.studentEditingLocked,
            }
          : b
      );
    } else if (type === "END_CLASS") {
      setBoard((b) =>
        b ? { ...b, liveEnded: true, studentEditingLocked: true, endedAt: new Date().toISOString() } : b
      );
      setEndedBanner("The teacher ended the live class.");
      setSelectedId(null);
    } else if (type === "REOPEN_CLASS") {
      setBoard((b) => (b ? { ...b, liveEnded: false, endedAt: null } : b));
      setEndedBanner("");
    } else if (type === "CHANGE_PAGE") {
      if (op.pageNumber) setPage(Number(op.pageNumber));
    } else if (type === "ADD_PAGE") {
      setBoard((b) => {
        if (!b) return b;
        const nextNum = (b.pages || []).reduce((m, p) => Math.max(m, p.pageNumber), 0) + 1;
        return {
          ...b,
          pages: [
            ...(b.pages || []),
            {
              pageNumber: nextNum,
              title: String(op.title || `Page ${nextNum}`),
              backgroundColor: String(op.backgroundColor || "#0B1824"),
            },
          ],
          currentPage: nextNum,
        };
      });
      const nextNum =
        (board?.pages || []).reduce((m, p) => Math.max(m, p.pageNumber), 0) + 1;
      setPage(nextNum);
    } else if (type === "RAISE_HAND") {
      // presence list updated via board:presence
    }
  }

  function undo() {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current.push(cloneObjects(objects));
    setObjects(prev);
  }

  function redo() {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(cloneObjects(objects));
    setObjects(next);
  }

  function pointerPos() {
    const stage = stageRef.current;
    if (!stage) return null;
    const p = stage.getPointerPosition();
    if (!p) return null;
    return {
      x: (p.x - position.x) / scale,
      y: (p.y - position.y) / scale,
    };
  }

  function onPointerDown() {
    if (!canEdit && tool !== "pan" && tool !== "select") return;
    const pos = pointerPos();
    if (!pos) return;

    if (tool === "pan") return;

    if (tool === "select") {
      setSelectedId(null);
      return;
    }

    if (tool === "eraser") {
      const hit = pageObjects
        .slice()
        .reverse()
        .find((o) => {
          if (o.type === "path" || o.type === "highlighter") {
            const pts = (o.data.points as number[]) || [];
            for (let i = 0; i < pts.length; i += 2) {
              if (Math.hypot(pts[i] - pos.x, pts[i + 1] - pos.y) < 14) return true;
            }
            return false;
          }
          return (
            pos.x >= o.x &&
            pos.x <= o.x + (o.width || 0) &&
            pos.y >= o.y &&
            pos.y <= o.y + (o.height || 0)
          );
        });
      if (hit) {
        const next = objects.map((o) => (o.id === hit.id ? { ...o, deleted: true } : o));
        pushHistory(next);
        emitOperation({ type: "DELETE", objectId: hit.id });
      }
      return;
    }

    if (tool === "text") {
      const text = window.prompt("Enter text");
      if (!text) return;
      const obj: WhiteboardObject = {
        id: uid(),
        type: "text",
        x: pos.x,
        y: pos.y,
        width: 200,
        height: 40,
        rotation: 0,
        zIndex: objects.length + 1,
        style: { fill: color, fontSize: 22, fontFamily: "Georgia, serif" },
        data: { text },
        createdBy: user?.id,
        pageNumber: page,
      };
      pushHistory([...objects, obj]);
      emitOperation({ type: "CREATE", object: obj });
      return;
    }

    const isStroke = tool === "pen" || tool === "highlighter";
    const obj: WhiteboardObject = {
      id: uid(),
      type: isStroke ? (tool === "highlighter" ? "highlighter" : "path") : tool,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      rotation: 0,
      zIndex: objects.length + 1,
      style: {
        stroke: color,
        fill: tool === "rect" || tool === "circle" ? "transparent" : undefined,
        strokeWidth: tool === "highlighter" ? 18 : strokeWidth,
        opacity: tool === "highlighter" ? 0.35 : 1,
      },
      data: isStroke ? { points: [pos.x, pos.y] } : { x2: pos.x, y2: pos.y },
      createdBy: user?.id,
      pageNumber: page,
    };
    drawingRef.current = obj;
    setObjects((prev) => [...prev, obj]);
  }

  function onPointerMove() {
    const pos = pointerPos();
    if (pos && socketRef.current?.connected) {
      socketRef.current.emit("board:cursor", { cursor: pos });
    }

    const draft = drawingRef.current;
    if (!draft || !pos) return;

    if (draft.type === "path" || draft.type === "highlighter") {
      const points = [...((draft.data.points as number[]) || []), pos.x, pos.y];
      draft.data = { ...draft.data, points };
      draft.width = Math.max(...points.filter((_, i) => i % 2 === 0)) - draft.x;
      draft.height = Math.max(...points.filter((_, i) => i % 2 === 1)) - draft.y;
    } else {
      draft.data = { ...draft.data, x2: pos.x, y2: pos.y };
      draft.width = pos.x - draft.x;
      draft.height = pos.y - draft.y;
    }
    setObjects((prev) => prev.map((o) => (o.id === draft.id ? { ...draft } : o)));
  }

  function onPointerUp() {
    const draft = drawingRef.current;
    if (!draft) return;
    drawingRef.current = null;
    historyRef.current.push(cloneObjects(objectsRef.current.filter((o) => o.id !== draft.id)));
    if (historyRef.current.length > 40) historyRef.current.shift();
    futureRef.current = [];
    emitOperation({ type: "DRAW", object: draft });
  }

  function clearPage() {
    if (!canEdit) return;
    if (!window.confirm("Clear this page for everyone?")) return;
    const next = objects.map((o) =>
      o.pageNumber === page && !o.deleted ? { ...o, deleted: true } : o
    );
    pushHistory(next);
    emitOperation({ type: "CLEAR", pageNumber: page });
  }

  function toggleLock() {
    if (!isTeacher || !board || classEnded) return;
    const locked = !board.studentEditingLocked;
    setBoard({ ...board, studentEditingLocked: locked });
    emitOperation({ type: "LOCK_STUDENTS", locked });
  }

  function endClass() {
    if (!isTeacher || !board || endingClass || classEnded) return;
    const ok = window.confirm(
      "End this live class for everyone? Students will leave the call and cannot draw until you reopen."
    );
    if (!ok) return;
    setEndingClass(true);
    setError("");
    setBoard({
      ...board,
      liveEnded: true,
      studentEditingLocked: true,
      endedAt: new Date().toISOString(),
    });
    setEndedBanner("You ended the live class.");
    setSelectedId(null);
    const socket = socketRef.current;
    if (socket?.connected) {
      emitOperation({ type: "END_CLASS" });
      setEndingClass(false);
    } else {
      boardApi
        .endClass(boardId)
        .then((r) => setBoard((b) => (b ? { ...b, ...r.board, liveEnded: true } : b)))
        .catch((err) => setError(err instanceof Error ? err.message : "Could not end class."))
        .finally(() => setEndingClass(false));
    }
  }

  function reopenClass() {
    if (!isTeacher || !board || endingClass) return;
    setEndingClass(true);
    setError("");
    setBoard({ ...board, liveEnded: false, endedAt: null });
    setEndedBanner("");
    const socket = socketRef.current;
    if (socket?.connected) {
      emitOperation({ type: "REOPEN_CLASS" });
      setEndingClass(false);
    } else {
      boardApi
        .reopenClass(boardId)
        .then((r) => setBoard((b) => (b ? { ...b, ...r.board, liveEnded: false } : b)))
        .catch((err) => setError(err instanceof Error ? err.message : "Could not reopen class."))
        .finally(() => setEndingClass(false));
    }
  }

  function changePage(pageNumber: number) {
    setPage(pageNumber);
    setSelectedId(null);
    if (isTeacher) emitOperation({ type: "CHANGE_PAGE", pageNumber });
  }

  function addPage() {
    if (!isTeacher) return;
    emitOperation({ type: "ADD_PAGE" });
    const nextNum = (board?.pages || []).reduce((m, p) => Math.max(m, p.pageNumber), 0) + 1;
    setBoard((b) =>
      b
        ? {
            ...b,
            pages: [
              ...(b.pages || []),
              { pageNumber: nextNum, title: `Page ${nextNum}`, backgroundColor: "#0B1824" },
            ],
            currentPage: nextNum,
          }
        : b
    );
    setPage(nextNum);
  }

  function raiseHand() {
    setHandRaised(true);
    emitOperation({ type: "RAISE_HAND" });
  }

  function exportPng() {
    const stage = stageRef.current;
    if (!stage) return;
    const uri = stage.toDataURL({ pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = uri;
    a.download = `${board?.title || "whiteboard"}-page-${page}.png`;
    a.click();
  }

  function renderObject(obj: WhiteboardObject) {
    const common = {
      id: obj.id,
      key: obj.id,
      rotation: obj.rotation,
      opacity: obj.style.opacity ?? 1,
      draggable: tool === "select" && canEdit,
      onClick: () => {
        if (tool === "select") setSelectedId(obj.id);
      },
      onTap: () => {
        if (tool === "select") setSelectedId(obj.id);
      },
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        const patch = { ...obj, x: e.target.x(), y: e.target.y() };
        setObjects((prev) => prev.map((o) => (o.id === obj.id ? patch : o)));
        emitOperation({ type: "UPDATE", object: patch });
      },
    };

    if (obj.type === "path" || obj.type === "highlighter") {
      return (
        <Line
          {...common}
          points={(obj.data.points as number[]) || []}
          stroke={obj.style.stroke}
          strokeWidth={obj.style.strokeWidth || 3}
          tension={0.4}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation="source-over"
        />
      );
    }
    if (obj.type === "line") {
      return (
        <Line
          {...common}
          points={[obj.x, obj.y, Number(obj.data.x2), Number(obj.data.y2)]}
          stroke={obj.style.stroke}
          strokeWidth={obj.style.strokeWidth || 3}
        />
      );
    }
    if (obj.type === "arrow") {
      return (
        <Arrow
          {...common}
          points={[obj.x, obj.y, Number(obj.data.x2), Number(obj.data.y2)]}
          stroke={obj.style.stroke}
          fill={obj.style.stroke}
          strokeWidth={obj.style.strokeWidth || 3}
          pointerLength={12}
          pointerWidth={12}
        />
      );
    }
    if (obj.type === "rect") {
      return (
        <Rect
          {...common}
          x={obj.x}
          y={obj.y}
          width={obj.width}
          height={obj.height}
          stroke={obj.style.stroke}
          fill={obj.style.fill || "transparent"}
          strokeWidth={obj.style.strokeWidth || 3}
        />
      );
    }
    if (obj.type === "circle") {
      const r = Math.max(Math.abs(obj.width), Math.abs(obj.height)) / 2;
      return (
        <Circle
          {...common}
          x={obj.x + obj.width / 2}
          y={obj.y + obj.height / 2}
          radius={r || 1}
          stroke={obj.style.stroke}
          fill={obj.style.fill || "transparent"}
          strokeWidth={obj.style.strokeWidth || 3}
        />
      );
    }
    if (obj.type === "text") {
      return (
        <Text
          {...common}
          x={obj.x}
          y={obj.y}
          text={String(obj.data.text || "")}
          fill={obj.style.fill || "#F0E0B8"}
          fontSize={obj.style.fontSize || 22}
          fontFamily={obj.style.fontFamily || "Georgia, serif"}
          width={obj.width || 240}
        />
      );
    }
    return null;
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  if (!board) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg px-6 py-16">
          <ErrorBanner message={error || "Board not found."} />
          <Button variant="ghost" onClick={() => navigate(`${home}`)}>
            Back to classroom
          </Button>
        </div>
      </PageShell>
    );
  }

  const bg =
    board.pages?.find((p) => p.pageNumber === page)?.backgroundColor || "#0B1824";

  return (
    <PageShell className="!overflow-hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-bronze">
              DIPSAN ACADEMY CLASSROOM
            </p>
            <h1 className="font-display text-xl font-semibold text-mist sm:text-2xl">
              {board.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-bronze">{saving ? "Saving…" : `v${board.version}`}</span>
            <Link to={`${home}`}>
              <Button variant="ghost">Hub</Button>
            </Link>
            <Button variant="ghost" onClick={exportPng}>
              Export PNG
            </Button>
          </div>
        </div>

        <ErrorBanner message={error} />

        {user && (
          <CallDock
            socket={socket}
            boardId={boardId}
            selfUserId={user.id}
            selfName={user.name}
            peers={presence}
            forceEnded={classEnded}
          />
        )}

        {(classEnded || endedBanner) && (
          <div className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-champagne">
            <p className="font-semibold">
              {classEnded ? "Live class ended" : "Class update"}
            </p>
            <p className="mt-1 text-bronze">
              {endedBanner ||
                "This session is closed. Students cannot draw or rejoin the call until the teacher reopens it."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {!isTeacher && (
                <Button variant="ghost" onClick={() => navigate(home)}>
                  Back to classroom
                </Button>
              )}
              {isTeacher && classEnded && (
                <Button onClick={reopenClass} disabled={endingClass}>
                  {endingClass ? "Reopening…" : "Reopen class"}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!canEdit && t.id !== "select" && t.id !== "pan"}
              onClick={() => setTool(t.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                tool === t.id
                  ? "bg-gold text-ink"
                  : "border border-white/15 bg-white/5 text-mist hover:border-gold/40"
              } disabled:opacity-40`}
            >
              {t.label}
            </button>
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-10 shrink-0 cursor-pointer rounded border border-white/15 bg-transparent"
            title="Color"
          />
          <input
            type="range"
            min={1}
            max={16}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-24 shrink-0 accent-gold"
            title="Stroke"
          />
          <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={undo}>
            Undo
          </Button>
          <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={redo}>
            Redo
          </Button>
          <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={clearPage} disabled={!canEdit}>
            Clear
          </Button>
          {isTeacher && (
            <>
              <Button
                variant="ghost"
                className="!px-3 !py-1.5 text-xs"
                onClick={toggleLock}
                disabled={classEnded}
              >
                {board.studentEditingLocked ? "Unlock students" : "Lock students"}
              </Button>
              <Button
                variant="ghost"
                className="!px-3 !py-1.5 text-xs"
                onClick={addPage}
                disabled={classEnded}
              >
                + Page
              </Button>
              {!classEnded ? (
                <Button
                  className="!px-3 !py-1.5 text-xs !bg-red-500/90 !text-white hover:!bg-red-400"
                  onClick={endClass}
                  disabled={endingClass}
                >
                  {endingClass ? "Ending…" : "End class"}
                </Button>
              ) : (
                <Button
                  className="!px-3 !py-1.5 text-xs"
                  onClick={reopenClass}
                  disabled={endingClass}
                >
                  {endingClass ? "Reopening…" : "Reopen class"}
                </Button>
              )}
            </>
          )}
          {!isTeacher && (
            <Button
              variant="ghost"
              className="!px-3 !py-1.5 text-xs"
              onClick={raiseHand}
              disabled={handRaised}
            >
              {handRaised ? "Hand raised" : "Raise hand"}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-bronze">
          <span>Pages:</span>
          {(board.pages || [{ pageNumber: 1, title: "Page 1", backgroundColor: bg }]).map((p) => (
            <button
              key={p.pageNumber}
              type="button"
              onClick={() => changePage(p.pageNumber)}
              className={`rounded-full px-2.5 py-1 ${
                page === p.pageNumber ? "bg-gold/20 text-champagne" : "bg-white/5 text-mist"
              }`}
            >
              {p.title || `Page ${p.pageNumber}`}
            </button>
          ))}
          <span className="ml-auto">
            Online:{" "}
            {presence.map((p) => (
              <span key={p.userId} className="ml-2 text-mist">
                {p.name}
                {p.handRaised ? " (hand)" : ""}
              </span>
            ))}
            {presence.length === 0 && <span className="ml-1">just you</span>}
          </span>
        </div>

        {lockedForStudent && (
          <p className="rounded-xl border border-gold/20 bg-gold/10 px-3 py-2 text-xs text-champagne">
            Students are locked — you can watch and raise your hand.
          </p>
        )}

        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#07121C]"
        >
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            draggable={tool === "pan"}
            onDragEnd={(e) => {
              if (tool === "pan") setPosition({ x: e.target.x(), y: e.target.y() });
            }}
            onWheel={(e) => {
              e.evt.preventDefault();
              const old = scale;
              const dir = e.evt.deltaY > 0 ? -1 : 1;
              const next = Math.min(2.5, Math.max(0.4, old + dir * 0.08));
              setScale(next);
            }}
            onMouseDown={onPointerDown}
            onMousemove={onPointerMove}
            onMouseup={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
          >
            <Layer>
              <Rect x={-2000} y={-2000} width={6000} height={6000} fill={bg} listening={false} />
              {pageObjects.map(renderObject)}
              <Transformer ref={transformerRef} rotateEnabled={false} borderStroke="#D4B06A" />
            </Layer>
            <Layer listening={false}>
              {Object.entries(remoteCursors).map(([id, c]) => (
                <Rect
                  key={id}
                  x={c.x}
                  y={c.y}
                  width={10}
                  height={10}
                  fill="#5EC8C0"
                  cornerRadius={2}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    </PageShell>
  );
}
