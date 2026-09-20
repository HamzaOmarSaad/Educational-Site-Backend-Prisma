import z from "zod";
import { generalValidationFields } from "../../common";
import { fileFieldValidation } from "../../common/multer";

export const createLessonVideoSchema = {
  body: z.strictObject({
    sectionId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    content: z.string().optional(),
    order: z.number(),
    isFree: z.boolean().optional(),
    duration: z.number().optional(),
    provider: z.string().optional(),
    file: generalValidationFields.file(fileFieldValidation.video),
  }),
};
export const createLessonAttachmentsSchema = {
  body: z.strictObject({
    sectionId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    content: z.string().optional(),
    order: z.number(),
    isFree: z.boolean().optional(),
    duration: z.number().optional(),
    provider: z.string().optional(),
    file: generalValidationFields.file(fileFieldValidation.file),
  }),
};
