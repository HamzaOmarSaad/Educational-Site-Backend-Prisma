import z from "zod";

export const createVoucherSchema = {
  body: z.strictObject({
    amount: z.coerce.number().positive(),
    teacherId: z.string(),
    expiresAt: z.coerce.date(),
  }),
};
export const redeemVoucherSchema = {
  body: z.strictObject({
    code: z.string(),
  }),
};
