import { createTeacherSchema } from "./admin.validation";
import z from "zod";

export type createTeacherDTO = z.infer<typeof createTeacherSchema.body>;
