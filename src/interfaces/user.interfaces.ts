import { ICourse, IEnrollment, ILessonProgress } from "./course.interfaces";
import { IAcademicYear, IGrade } from "./grade.interfaces";
import { IVoucher, IWallet } from "./payment.interfaces";
import { IQuizAttempt } from "./quiz.interfaces";

export enum UserRole {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
  ADMIN = "ADMIN",
}
export enum UserGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

// ============================================================
// USER
// ============================================================

export interface IUser {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  gender: UserGender;
  phone?: string;
  avatarUrl?: string;

  createdAt: Date;
  updatedAt?: Date;
  EmailConfirmedAt?: Date;

  teacherProfile?: ITeacherProfile;
  studentProfile?: IStudentProfile;

  courses?: ICourse[];

  enrollments?: IEnrollment[];
  progress?: ILessonProgress[];
  quizAttempts?: IQuizAttempt[];

  wallet?: IWallet;

  vouchersCreated?: IVoucher[];
  vouchersRedeemed?: IVoucher[];
}

// ============================================================
// TEACHER PROFILE
// ============================================================

export interface ITeacherProfile {
  id: string;
  userId: string;
  bio?: string;
  specialization?: string;
  experience?: number;
  qualifications?: string;
  createdAt: Date;
  updatedAt?: Date;

  user: IUser;
}

// ============================================================
// STUDENT PROFILE
// ============================================================

export interface IStudentProfile {
  id: string;
  userId: string;
  school?: string;
  gradeId: string;
  academicYearId?: string;
  createdAt: Date;
  updatedAt?: Date;

  user: IUser;
  grade: IGrade;
  academicYear?: IAcademicYear;
}
