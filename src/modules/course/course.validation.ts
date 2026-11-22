import z from "zod";
import { generalValidationFields } from "../../common";
import { fileFieldValidation } from "../../common/multer";

export const createCourseSchema = {
  body: z.object({
    name: z.string(),
    title: z.string().min(3).max(16),

    subjectId: z.uuid(),
    teacherId: z.uuid(),
    gradeId: z.uuid(),
    description: z.string().optional(),
    price: z.string(),
    file: generalValidationFields.file(fileFieldValidation.image),
  }),
};
export const createCourseSectionSchema = {
  body: z.object({
    title: z.string().min(3).max(16),
    courseId: z.uuid(),
    description: z.string().optional(),
    order: z.coerce.number(),
  }),
};
