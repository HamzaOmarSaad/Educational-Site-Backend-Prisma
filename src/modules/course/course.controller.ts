import { NextFunction, Request, Response, Router } from "express";
import { routes } from "./course.routes";
import { auth, authorize, validate } from "../../middlewares";
import { UserRole } from "../../interfaces";
import courseService from "./course.service";
import { successResult } from "../../common";
import { createCourseDTO, createCourseSectionDTO } from "./course.dto";
import {
  createCourseSchema,
  createCourseSectionSchema,
} from "./course.validation";

const router = Router();

router.post(
  routes.createCourse,
  auth(),
  authorize([UserRole.TEACHER, UserRole.ADMIN]),
  validate(createCourseSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await courseService.createCourse({
      ...req.body,
      file: req.file,
    } as createCourseDTO);
    return successResult({
      res,
      message: "course  created  successfully",
      data,
      statusCode: 201,
    });
  },
);
router.post(
  routes.createCourseSection,
  auth(),
  authorize([UserRole.TEACHER, UserRole.ADMIN]),
  validate(createCourseSectionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await courseService.createSection(
      req.body as createCourseSectionDTO,
    );
    return successResult({
      res,
      message: "course section created successfully",
      data,
      statusCode: 200,
    });
  },
);
export default router;
