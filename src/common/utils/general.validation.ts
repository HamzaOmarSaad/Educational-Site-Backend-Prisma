import { z } from "zod";

export const generalValidationFields = {
  id: z.string(),
  email: z.email(),
  phone: z
    .string({ error: "wrong phone number" })
    .regex(/^(00201|\+201|01)(0|1|2|5)\d{8}$/),
  otp: z.string({ error: "otp is required  " }).regex(/^\d{6}$/),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/,
      { error: " password  dont match " },
    ),
  file: function (mimetype: string[]) {
    return z
      .strictObject({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        path: z.string().optional(),
        buffer: z.any().optional(),
        size: z.number(),
        mimetype: z.enum(mimetype),
      })
      .superRefine((args, ctx) => {
        if (!args.path && !args.buffer) {
          ctx.addIssue({
            code: "custom",
            path: ["buffer"],
            message: "buffer is required",
          });
        }
      });
  },
};

export const paginationValidationSchema = {
  query: z.strictObject({
    page: z.coerce.number().optional(),
    size: z.coerce.number().optional(),
    search: z.string().optional(),
  }),
};

export type paginateDto = z.infer<typeof paginationValidationSchema.query>;
