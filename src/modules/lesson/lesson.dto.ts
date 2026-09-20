import z from "zod";
import {
  createLessonAttachmentsSchema,
  createLessonVideoSchema,
} from "./lesson.validation";

export type createLessonVideoDTO = z.infer<typeof createLessonVideoSchema.body>;
export type createLessonAttachmentDTO = z.infer<
  typeof createLessonAttachmentsSchema.body
>;
