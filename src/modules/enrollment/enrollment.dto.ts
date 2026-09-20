import z from "zod";
import { enrollCourseSchema } from "./enrollment.validation";

export type enrollCourseDTO = z.infer<typeof enrollCourseSchema.param>;
