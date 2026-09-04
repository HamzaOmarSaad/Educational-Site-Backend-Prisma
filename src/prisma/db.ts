import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json";

export const db = postgres<Contract>({
  contractJson,
  url: process.env["DATABASE_URL"]!,
});

export const userModel = db.orm.public.User;
export const teacherModel = db.orm.public.TeacherProfile;
export const studentModel = db.orm.public.StudentProfile;
