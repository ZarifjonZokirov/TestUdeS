export type UserRole = 'admin' | 'teacher';

export interface Teacher {
  id: string; // Login ID, e.g. "admin123"
  fullName: string;
  role: UserRole;
  password: string;
  createdAt: number;
}

export type QuestionType = 'multiple_choice' | 'written';

export interface Question {
  id: string;
  categoryId: string;
  questionText: string;
  type: QuestionType;
  options?: string[]; // 4 options for multiple choice
  correctOptionIndex?: number; // 0, 1, 2, 3 (Server secret!)
  correctWrittenAnswer?: string; // Server secret!
  orderIndex: number;
}

export interface PublicQuestion {
  id: string;
  categoryId: string;
  questionText: string;
  type: QuestionType;
  options?: string[]; // sanitized, no answer indicators
  orderIndex: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  defaultDurationMinutes: number;
  questionCountTarget: number;
  createdAt: number;
}

export interface AccessCode {
  code: string;
  categoryId: string;
  categoryName: string;
  durationMinutes: number;
  questionCount: number;
  createdAt: number;
  expiresAt: number; // exactly 2 minutes
  isUsed: boolean;
  createdBy: string;
}

export interface TestSession {
  sessionId: string;
  accessCode: string;
  studentName: string;
  categoryId: string;
  categoryName: string;
  questions: PublicQuestion[];
  durationMinutes: number;
  startedAt: number;
  expiresAt: number;
  status: 'in_progress' | 'completed' | 'terminated_esc' | 'expired';
}

export interface QuestionResultItem {
  questionId: string;
  questionText: string;
  type: QuestionType;
  options?: string[];
  studentAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
}

export interface TestResult {
  id: string;
  sessionId: string;
  studentName: string;
  categoryId: string;
  categoryName: string;
  totalQuestions: number;
  multipleChoiceCount: number;
  writtenCount: number;
  correctCount: number;
  scorePercent: number;
  isPassed: boolean; // >= 75%
  terminationReason: 'normal' | 'esc_key' | 'time_expired';
  submittedAt: number;
  durationSpentSeconds: number;
  answersBreakdown: QuestionResultItem[];
}
