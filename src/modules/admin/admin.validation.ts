import z from "zod";
import { loginSchema } from "../auth/auth.validation";
import { generalValidationFields } from "../../common";
import { UserGender } from "../../interfaces";
import { fileFieldValidation } from "../../common/multer";

export const createTeacherSchema = {
  body: loginSchema.body
    .safeExtend({
      name: z.string().min(3).max(16),
      rePassword: z.string().min(8).max(25).optional(),
      phone: generalValidationFields.phone,
      school: z.string().min(3).max(16),
      gender: z.enum(UserGender),

      subjectId: z.string().min(3).max(16),

      bio: z.string().min(3).max(16).optional(),
      specialization: z.string().min(3).max(16).optional(),
      experience: z.number().optional(),
      qualifications: z.string().min(3).max(16).optional(),
      file: generalValidationFields.file(fileFieldValidation.image),
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
