import { NextFunction, Request, Response, Router } from "express";
import { routes } from "./user.routes";
import userService from "./user.service";
import { successResult } from "../../common";
import { auth } from "../../middlewares/authentication.middleware";
import { authorize } from "../../middlewares/authorization.middleware";
import { UserRole } from "../../interfaces";

const router = Router();

router.post(
  routes.subscribeTeacher,
  auth(),
  authorize([UserRole.STUDENT]),
  async (req: Request, res: Response) => {
    const data = await userService.subscribeWithTeacher(
      req.user.id as string,
      req.params.teacherId as string,
    );
    return successResult({ res, message: "subscription request created", data, statusCode: 201 });
  },
);

router.get(
  routes.profile,
  auth(),
  authorize([UserRole.STUDENT]),
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
  routes.teacherProfile,
  auth(),
  authorize([UserRole.STUDENT]),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.getTeacherDetails(req.params.id as string);
    return successResult({
      res,
      message: "teacher profile retrieved successfully",
      data,
      statusCode: 200,
    });
  },
);

router.get(
  routes.myTeachers,
  auth(),
  authorize([UserRole.STUDENT]),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.getSubscribedTeachers(req.user.id as string);
    console.log("🚀 ~ data:", data);
    return successResult({
      res,
      message: "your teachers retrieved successfully",
      data,
      statusCode: 200,
    });
  },
);
router.get(
  routes.teachers,
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.getTeachersAll();
    console.log("🚀 ~ data:", data);
    return successResult({
      res,
      message: "teachers retrieved successfully",
      data,
      statusCode: 200,
    });
  },
);

export default router;
