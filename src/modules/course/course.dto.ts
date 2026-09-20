import z from "zod";
import {
  createCourseSchema,
  createCourseSectionSchema,
} from "./course.validation";

export type createCourseDTO = z.infer<typeof createCourseSchema.body>;
export type createCourseSectionDTO = z.infer<
  typeof createCourseSectionSchema.body
>;
