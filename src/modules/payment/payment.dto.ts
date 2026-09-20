import z from "zod";
import { createVoucherSchema, redeemVoucherSchema } from "./payment.validation";

export type createVoucherDto = z.infer<typeof createVoucherSchema.body>;
export type redeemVoucherDto = z.infer<typeof redeemVoucherSchema.body>;
