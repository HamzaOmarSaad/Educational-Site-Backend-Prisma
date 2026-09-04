import { IGrade, ISubject } from "./grade.interfaces";
import { IQuiz } from "./quiz.interfaces";
import { IUser } from "./user.interfaces";

export enum CourseStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum EnrollmentStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum LessonProgressStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}
export enum ContentType {
  VIDEO = "VIDEO",
  PDF = "PDF",
  DOCUMENT = "DOCUMENT",
  IMAGE = "IMAGE",
  OTHER = "OTHER",
}
// ============================================================
// COURSE
// ============================================================
export interface ICourse {
  id: string;
  teacherId: string;
  gradeId: string;
  subjectId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  price: number;
  status: CourseStatus;
  createdAt: Date;
  updatedAt?: Date;

  teacher: IUser;
  grade: IGrade;
  subject: ISubject;

  sections: ICourseSection[];
  enrollments: IEnrollment[];
}

// ============================================================
// COURSE SECTION
// ============================================================

export interface ICourseSection {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt?: Date;

  course: ICourse;
  lessons: ILesson[];
}

// ============================================================
// LESSON
// ============================================================

export interface ILesson {
  id: string;
  sectionId: string;
  title: string;
  description?: string;
  content?: string;
  order: number;
  isFree: boolean;
  createdAt: Date;
  updatedAt?: Date;

  section: ICourseSection;
  video?: ILessonVideo;
  attachments: ILessonAttachment[];
  progress: ILessonProgress[];
  quizzes: IQuiz[];
}

// ============================================================
// LESSON VIDEO
// ============================================================

export interface ILessonVideo {
  id: string;
  lessonId: string;
  url: string;
  duration?: number;
  provider?: string;
  videoKey?: string;
  createdAt: Date;
  updatedAt?: Date;

  lesson: ILesson;
}

// ============================================================
// LESSON ATTACHMENT
// ============================================================

export interface ILessonAttachment {
  id: string;
  lessonId: string;
  name: string;
  url: string;
  key?: string;
  type: ContentType;
  size?: number;
  createdAt: Date;

  lesson: ILesson;
}

// ============================================================
// ENROLLMENT
// ============================================================

export interface IEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt?: Date;

  student: IUser;
  course: ICourse;
}

// ============================================================
// LESSON PROGRESS
// ============================================================

export interface ILessonProgress {
  id: string;
  studentId: string;
  lessonId: string;
  status: LessonProgressStatus;
  progress: number;
  watchedSeconds: number;
  completedAt?: Date;
  updatedAt?: Date;

  student: IUser;
  lesson: ILesson;
}
