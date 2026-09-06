import { NextFunction, Request, Response, Router } from "express";
import routes from "./auth.routes";
import authService from "./auth.service";
import { confirmEmailDTo, ISignupDTO } from "./auth.dto";
import { successResult } from "../../common";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import { signupSchema } from "./auth.validation";

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
  routes.confirmEmail,
  validationMiddleware(signupSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await authService.confirmEmail(req.body as confirmEmailDTo);
    return successResult({
      res,
      message: "user created successfully",
      data,
      statusCode: 201,
    });
  },
);
export default router;
