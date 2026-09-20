import z from "zod";

export const enrollCourseSchema = {
  param: z.strictObject({
    courseId: z.string(),
  }),
  body: z.strictObject({}),
};
