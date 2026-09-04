// ============================================================
// GRADE
// ============================================================

import { ICourse } from "./course.interfaces";
import { IStudentProfile } from "./user.interfaces";

export interface IGrade {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;

  students: IStudentProfile[];
  courses: ICourse[];
  academicYears: IAcademicYear[];
}

// ============================================================
// ACADEMIC YEAR
// ============================================================

export interface IAcademicYear {
  id: string;
  gradeId: string;
  name: string;
  year: number;
  createdAt: Date;

  grade: IGrade;
  students: IStudentProfile[];
  subjects: ISubject[];
}

// ============================================================
// SUBJECT
// ============================================================

export interface ISubject {
  id: string;
  academicYearId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;

  academicYear: IAcademicYear;
  courses: ICourse[];
}
