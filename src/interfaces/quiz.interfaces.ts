import { ILesson } from "./course.interfaces";
import { IUser } from "./user.interfaces";

export enum QuestionType {
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
  TEXT = "TEXT",
}

// ============================================================
// QUIZ
// ============================================================

export interface IQuiz {
  id: string;
  lessonId: string;
  title: string;
  description?: string;
  passingScore?: number;
  timeLimit?: number;
  createdAt: Date;
  updatedAt?: Date;

  lesson: ILesson;
  questions: IQuizQuestion[];
  attempts: IQuizAttempt[];
}

// ============================================================
// QUIZ QUESTION
// ============================================================

export interface IQuizQuestion {
  id: string;
  quizId: string;
  question: string;
  type: QuestionType;
  points: number;
  order: number;
  createdAt: Date;

  quiz: IQuiz;
  answers: IAnswer[];
}

// ============================================================
// ANSWER / CHOICE
// ============================================================

export interface IAnswer {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number;

  question: IQuizQuestion;
}

// ============================================================
// QUIZ ATTEMPT
// ============================================================

export interface IQuizAttempt {
  id: string;
  studentId: string;
  quizId: string;
  score?: number;
  percentage?: number;
  startedAt: Date;
  completedAt?: Date;

  student: IUser;
  quiz: IQuiz;
  answers: IQuizAnswer[];
}

// ============================================================
// QUIZ ANSWER
// ============================================================

export interface IQuizAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  answerId?: string;
  textAnswer?: string;
  isCorrect?: boolean;
  points?: number;

  attempt: IQuizAttempt;
  question: IQuizQuestion;
  answer?: IAnswer;
}
