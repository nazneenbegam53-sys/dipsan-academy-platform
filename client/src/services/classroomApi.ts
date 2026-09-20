import { io, Socket } from "socket.io-client";
import { api, API_URL, getToken } from "./api";
import type { Board, Classroom, PresenceUser, WhiteboardObject } from "../types";

function socketBaseUrl() {
  const base = API_URL.replace(/\/api\/?$/, "");
  return base || window.location.origin;
}

export function connectBoardSocket(boardId: string, token?: string | null): Socket {
  const authToken = token ?? getToken();
  const socket = io(socketBaseUrl(), {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: { token: authToken },
    query: { token: authToken || "" },
    autoConnect: true,
  });

  socket.on("connect", () => {
    socket.emit("board:join", { boardId });
  });

  return socket;
}

export const classroomApi = {
  list: () => api.get<{ classrooms: Classroom[] }>("/classrooms"),
  get: (id: string) => api.get<{ classroom: Classroom }>(`/classrooms/${id}`),
  create: (name?: string) =>
    api.post<{ classroom: Classroom }>("/classrooms", {
      name: name || "DIPSAN ACADEMY CLASSROOM",
    }),
  join: (joinCode: string) =>
    api.post<{ classroom: Classroom; alreadyMember?: boolean }>("/classrooms/join", { joinCode }),
};

export const boardApi = {
  list: (classroomId: string) =>
    api.get<{ boards: Board[] }>(`/boards?classroomId=${encodeURIComponent(classroomId)}`),
  create: (classroomId: string, title?: string) =>
    api.post<{ board: Board }>("/boards", { classroomId, title: title || "Whiteboard" }),
  get: (id: string) => api.get<{ board: Board }>(`/boards/${id}`),
  state: (id: string) => api.get<{ board: Board }>(`/boards/${id}/state`),
  snapshot: (id: string, objects: WhiteboardObject[]) =>
    api.put<{ board: Board }>(`/boards/${id}/snapshot`, { objects }),
  operate: (id: string, operation: Record<string, unknown>) =>
    api.post<{ board: Board; operation: Record<string, unknown> }>(`/boards/${id}/operations`, operation),
  endClass: (id: string) =>
    api.post<{ board: Board; operation: Record<string, unknown> }>(`/boards/${id}/end`, {}),
  reopenClass: (id: string) =>
    api.post<{ board: Board; operation: Record<string, unknown> }>(`/boards/${id}/reopen`, {}),
};

export type { PresenceUser };
