import z from "zod";
import { generalValidationFields } from "../../common";
import { fileFieldValidation } from "../../common/multer";

export const createCourseSchema = {
  body: z.object({
    name: z.string().min(3).max(16),
    title: z.string().min(3).max(16),

    subjectId: z.string().min(3).max(16),
    teacherId: z.string().min(3).max(16),
    gradeId: z.string().min(3).max(16),
    description: z.string().min(3).max(16).optional(),
    price: z.string(),
    file: generalValidationFields.file(fileFieldValidation.image),
  }),
};
export const createCourseSectionSchema = {
  body: z.object({
    title: z.string().min(3).max(16),

    courseId: z.string().min(3).max(16),
    description: z.string().min(3).max(16).optional(),
    order: z.number(),
  }),
};
