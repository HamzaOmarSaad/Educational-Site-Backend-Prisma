import { NextFunction, Request, Response, Router } from "express";
import { routes } from "./user.routes";
import userService from "./user.service";
import { successResult } from "../../common";
import { auth } from "../../middlewares/authentication.middleware";
import { authorize } from "../../middlewares/authorization.middleware";
import { UserRole } from "../../interfaces";

const router = Router();

router.get(
  routes.profile,
  auth(),
  authorize([UserRole.STUDENT, UserRole.TEACHER]),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.getProfile(req.user.id as string);
    return successResult({
      res,
      message: "profile retrieved successfully",
      data,
      statusCode: 200,
    });
  },
);

router.get(
  routes.studentProfile,
  auth(),
  authorize([UserRole.STUDENT]),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.getStudentProfile(req.user.id as string);
    return successResult({
      res,
      message: "student profile retrieved successfully",
      data,
      statusCode: 200,
    });
  },
);

router.get(
  routes.teacherProfile,
  auth(),
  authorize([UserRole.TEACHER]),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.getTeacherDetails(req.user.id as string);
    return successResult({
      res,
      message: "teacher profile retrieved successfully",
      data,
      statusCode: 200,
    });
  },
);

export default router;
