import z from "zod";
import {
  confirmEmailSchema,
  loginSchema,
  resendEmailSchema,
  signupSchema,
} from "./auth.validation";

export type ISignupDTO = z.infer<typeof signupSchema.body>;
export type ILoginDTO = z.infer<typeof loginSchema.body>;

export type confirmEmailDTo = z.infer<typeof confirmEmailSchema.body>;
export type resendEmailDTO = z.infer<typeof resendEmailSchema.body>;
