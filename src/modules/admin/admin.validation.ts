import z from "zod";
import { loginSchema } from "../auth/auth.validation";
import { generalValidationFields } from "../../common";
import { UserGender } from "../../interfaces";
import { fileFieldValidation } from "../../common/multer";

const uploadedImageSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.enum(fileFieldValidation.image),
  size: z.number().max(5 * 1024 * 1024),
  buffer: z.any().optional(),
  path: z.string().optional(),
}).superRefine((file, ctx) => {
  if (!file.buffer && !file.path) {
    ctx.addIssue({ code: "custom", path: ["buffer"], message: "Image data is missing." });
  }
});

export const createTeacherSchema = {
  body: loginSchema.body
    .safeExtend({
      name: z.string().min(3).max(80),
      rePassword: generalValidationFields.password,
      phone: generalValidationFields.phone,
      gender: z.enum(UserGender),
      subjectId: z.uuid(),

      bio: z.string().max(1000).optional(),
      specialization: z.string().max(100).optional(),
      experience: z.coerce.number().int().min(0).max(80).optional(),
      qualifications: z.string().max(1000).optional(),
      file: uploadedImageSchema.optional(),
    })
    .refine(
      (val) => {
        return val?.password === val?.rePassword;
      },
      {
        error: "password don't match  ",
        path: ["password", "rePassword"],
      },
    ),
};

export const updateTeacherSchema = {
  body: z.object({
    name: z.string().min(3).max(80).optional(),
    email: generalValidationFields.email.optional(),
    phone: generalValidationFields.phone.optional(),
    bio: z.string().max(1000).optional(),
    specialization: z.string().max(100).optional(),
    experience: z.coerce.number().int().min(0).max(80).optional(),
    qualifications: z.string().max(1000).optional(),
  }).refine((data) => Object.keys(data).length > 0, { error: "At least one field is required." }),
};
