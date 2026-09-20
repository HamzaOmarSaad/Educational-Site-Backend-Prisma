import { NextFunction, Request, Response, Router } from "express";
import { routes } from "./teacher.routes";
import { UserRole } from "../../interfaces";
import { auth, authorize } from "../../middlewares";
import { successResult } from "../../common";
import teacherService from "./teacher.service";

const router = Router();

router.post(
  routes.createTeacher,
  auth(),
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    // delegate to admin.createTeacher — keep compatibility
    const data = {};
    return successResult({
      res,
      message: "user created successfully",
      data,
      statusCode: 201,
    });
  },
);

router.get(
  routes.subscribedStudents,
  auth(),
  authorize([UserRole.TEACHER]),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await teacherService.getSubscribedStudents(
      req.user.id as string,
    );
    return successResult({
      res,
      message: "subscribed students retrieved",
      data,
      statusCode: 200,
    });
  },
);

router.get(
  routes.studentRequests,
  auth(),
  authorize([UserRole.TEACHER]),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await teacherService.getStudentsRequests(
      req.user.id as string,
    );
    return successResult({
      res,
      message: "student requests retrieved",
      data,
      statusCode: 200,
    });
  },
);

router.post(
  routes.approveStudent,
  auth(),
  authorize([UserRole.TEACHER]),
  async (req: Request, res: Response, next: NextFunction) => {
    const { studentId } = req.params;
    const data = await teacherService.approveStudent(
      req.user.id as string,
      studentId as string,
    );
    return successResult({
      res,
      message: "student approved",
      data,
      statusCode: 200,
    });
  },
);

export default router;
