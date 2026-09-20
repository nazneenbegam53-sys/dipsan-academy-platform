export type Role = "student" | "teacher";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  className?: string;
  rollNumber?: string;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  needsPhone?: boolean;
}

export type WhiteboardTool =
  | "select"
  | "pen"
  | "highlighter"
  | "eraser"
  | "line"
  | "arrow"
  | "rect"
  | "circle"
  | "text"
  | "pan";

export interface WhiteboardObjectStyle {
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
}

export interface WhiteboardObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  style: WhiteboardObjectStyle;
  data: Record<string, unknown>;
  createdBy?: string;
  pageNumber: number;
  deleted?: boolean;
  version?: number;
}

export interface BoardPage {
  pageNumber: number;
  title: string;
  backgroundColor: string;
}

export interface Board {
  _id: string;
  classroom: string;
  title: string;
  createdBy: string;
  studentEditingLocked: boolean;
  liveEnded?: boolean;
  endedAt?: string | null;
  currentPage: number;
  version: number;
  pages: BoardPage[];
  objects?: WhiteboardObject[];
  objectCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassroomMember {
  user: string | { _id: string; name: string; role: Role };
  role: Role;
}

export interface Classroom {
  _id: string;
  name: string;
  teacher: string | { _id: string; name: string; role: Role };
  joinCode: string;
  members: ClassroomMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PresenceUser {
  userId: string;
  name: string;
  role: Role;
  handRaised?: boolean;
  cursor?: { x: number; y: number } | null;
  socketId?: string;
}
