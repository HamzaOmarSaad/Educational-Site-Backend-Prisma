import { NextFunction, Request, Response, Router } from "express";
import { successResult } from "../../common";
import { validate } from "../../middlewares/validation.middleware";
import {
  confirmEmailDTo,
  ILoginDTO,
  ISignupDTO,
  resendEmailDTO,
} from "./auth.dto";
import routes from "./auth.routes";
import authService from "./auth.service";
import {
  confirmEmailSchema,
  loginSchema,
  adminLoginSchema,
  teacherLoginSchema,
  resendEmailSchema,
  signupSchema,
} from "./auth.validation";
import { badRequestException } from "../../common";
import { UserRole } from "../../interfaces";

const router = Router();

router.post(
  routes.signup,
  validate(signupSchema),
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
  validate(loginSchema),
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
  routes.adminLogin,
  validate(adminLoginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await authService.login(
      req.body as ILoginDTO,
      `${req.protocol}://${req.host}`,
    );
    if (!data.user || data.user.role !== UserRole.ADMIN) {
      throw new badRequestException("invalid credentials for admin");
    }
    return successResult({
      res,
      message: "admin logged in successfully",
      data,
      statusCode: 200,
    });
  },
);

router.post(
  routes.teacherLogin,
  validate(teacherLoginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await authService.login(
      req.body as ILoginDTO,
      `${req.protocol}://${req.host}`,
    );
    if (!data.user || data.user.role !== UserRole.TEACHER) {
      throw new badRequestException("invalid credentials for teacher");
    }
    return successResult({
      res,
      message: "teacher logged in successfully",
      data,
      statusCode: 200,
    });
  },
);
router.post(
  routes.confirmEmail,
  validate(confirmEmailSchema),
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
  validate(resendEmailSchema),
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
