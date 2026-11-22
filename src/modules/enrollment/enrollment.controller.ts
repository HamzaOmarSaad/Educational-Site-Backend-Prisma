import { NextFunction, Request, Response, Router } from "express";
import { auth, authorize } from "../../middlewares";
import { UserRole } from "../../interfaces";
import { successResult } from "../../common";
import { enrollCourseDTO } from "./enrollment.dto";
import enrollmentService from "./enrollment.service";

const router = Router();

router.post(
  "/enroll-course/:courseId",
  auth(),
  authorize([UserRole.STUDENT]),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await enrollmentService.enrollCourse(
      req.params as enrollCourseDTO,
      req.user.id as string,
    );
    return successResult({
      res,
      message: "course enrolled successfully",
      data,
      statusCode: 201,
    });
  },
);

export default router;
