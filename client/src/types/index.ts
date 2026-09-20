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

export interface Question {
  _id: string;
  type: "mcq" | "multi-correct" | "numerical" | "true-false" | "assertion-reason";
  text: string;
  imageUrl?: string | null;
  options: string[];
  correctOptionIndex?: number | null;
  correctOptionIndexes?: number[];
  correctNumericValue?: number | null;
  numericTolerance?: number;
  marks: number;
  negativeMarks: number;
  chapter?: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  explanation?: string;
  explanationImageUrl?: string | null;
  explanationVideoUrl?: string | null;
  explanationVideoStatus?: "none" | "draft" | "published";
  explanationVideoDuration?: number | null;
  explanationVideoProvider?: string | null;
}

export interface Exam {
  _id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  instructions: string;
  defaultMarks: number;
  defaultNegativeMarks: number;
  passingMarks: number;
  questions: Question[];
  questionCount?: number;
  totalMarks?: number;
  submissionCount?: number;
  status: "draft" | "published" | "archived";
  antiCheat: {
    requireFullscreen: boolean;
    autoSubmitOnViolations: boolean;
    maxViolations: number;
  };
}

export interface AnswerEntry {
  selected?: number | number[] | string;
  markedForReview?: boolean;
  visited?: boolean;
}

export interface Attempt {
  _id: string;
  exam: string | Exam;
  student: string | User;
  answers: Record<string, AnswerEntry>;
  startedAt: string;
  submittedAt: string | null;
  timeTakenSeconds: number | null;
  status: "in-progress" | "submitted" | "auto-submitted";
  score: number | null;
  totalMarks: number | null;
  correctCount: number | null;
  wrongCount: number | null;
  unattemptedCount: number | null;
  violations: { type: string; at: string }[];
}

export interface Note {
  _id: string;
  title: string;
  subject?: string;
  fileUrl: string;
  provider?: string;
  originalName?: string;
  size?: number;
  teacherName?: string;
  createdAt: string;
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
