import { NextFunction, Request, Response, Router } from "express";
import { auth, authorize, validate } from "../../middlewares";
import { UserRole } from "../../interfaces";
import paymentService from "./payment.service";
import { successResult } from "../../common";
import { createVoucherSchema } from "./payment.validation";
import { createVoucherDto, redeemVoucherDto } from "./payment.dto";

const router = Router();
router.post(
  "/create-voucher",
  auth(),
  authorize([UserRole.TEACHER, UserRole.ADMIN]),
  validate(createVoucherSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await paymentService.createVoucher(
      req.body as createVoucherDto,
    );
    return successResult({
      res,
      message: "code created successfully",
      data,
      statusCode: 200,
    });
  },
);
router.post(
  "/redeem-voucher",
  auth(),
  authorize([UserRole.STUDENT]),
  validate(createVoucherSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await paymentService.redeemVoucher(
      req.body as redeemVoucherDto,
      req.user.id as string,
    );
    return successResult({
      res,
      message: "code redeem successfully",
      data,
      statusCode: 200,
    });
  },
);

export default router;
