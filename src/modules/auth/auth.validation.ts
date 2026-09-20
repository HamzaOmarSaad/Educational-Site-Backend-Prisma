import * as z from "zod";
import { generalValidationFields } from "../../common";
import { GradeEnum, trackYear } from "../../Enums";
import { UserGender } from "../../interfaces";

export const loginSchema = {
  body: z.strictObject({
    email: generalValidationFields.email,
    password: generalValidationFields.password,
    FCM: z.string().optional(),
  }),
};
export const adminLoginSchema = loginSchema;
export const teacherLoginSchema = loginSchema;
export const signupSchema = {
  body: loginSchema.body
    .safeExtend({
      name: z.string().min(3).max(16),
      rePassword: z.string().min(8).max(25).optional(),
      phone: generalValidationFields.phone,
      parentPhone: generalValidationFields.phone,
      school: z.string().min(3).max(16),
      grade: z.enum(GradeEnum),
      track: z.enum(trackYear),
      gender: z.enum(UserGender),
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

export const resendEmailSchema = {
  body: z.object({
    email: generalValidationFields.email,
  }),
};
export const confirmEmailSchema = {
  body: z.object({
    email: generalValidationFields.email,
    otp: generalValidationFields.otp,
  }),
};
