import { NextFunction, Request, Response, Router } from "express";
import routes from "./auth.routes";
import authService from "./auth.service";
import {
  confirmEmailDTo,
  ILoginDTO,
  ISignupDTO,
  resendEmailDTO,
} from "./auth.dto";
import { successResult } from "../../common";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import {
  confirmEmailSchema,
  loginSchema,
  resendEmailSchema,
  signupSchema,
} from "./auth.validation";

const router = Router();

router.post(
  routes.signup,
  validationMiddleware(signupSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await authService.signup(req.body as ISignupDTO);
    return successResult({
      res,
      message: "user created successfully",
      data,
      statusCode: 201,
    });
  },
);
router.post(
  routes.login,
  validationMiddleware(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await authService.login(
      req.body as ILoginDTO,
      `${req.protocol}://${req.host}`,
    );
    return successResult({
      res,
      message: "user logged in successfully",
      data,
      statusCode: 200,
    });
  },
);
router.post(
  routes.confirmEmail,
  validationMiddleware(confirmEmailSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await authService.confirmEmail(req.body as confirmEmailDTo);
    return successResult({
      res,
      message: "email confirmed successfully",
      data,
      statusCode: 201,
    });
  },
);
router.post(
  routes.resendEmail,
  validationMiddleware(resendEmailSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await authService.resendEmail(req.body as resendEmailDTO);
    return successResult({
      res,
      message: "email resent successfully",
      data,
      statusCode: 201,
    });
  },
);

export default router;
