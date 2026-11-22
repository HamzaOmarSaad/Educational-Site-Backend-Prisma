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
import { cloudFileUpload, fileFieldValidation } from "../../common/multer";

const router = Router();

router.get(
  "/teacher/options",
  auth(),
  authorize([UserRole.TEACHER]),
  async (req: Request, res: Response) => {
    const data = await courseService.getTeacherWorkspaceOptions(req.user.id as string);
    return successResult({ res, message: "teacher workspace options retrieved", data, statusCode: 200 });
  },
);

router.get(
  routes.getMyCourse,
  auth(),
  authorize([UserRole.STUDENT]),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await courseService.getMyCourse(req.user.id as string);
    return successResult({
      res,
      message: "courses retrieved successfully",
      data,
      statusCode: 201,
    });
  },
);
router.get(
  routes.getSubjects,
  async (req: Request, res: Response) => {
    const requestedYear = Number(req.query.year);
    const year = Number.isInteger(requestedYear) && requestedYear > 2000 ? requestedYear : undefined;
    const data = await courseService.getSubjects(year);
    return successResult({
      res,
      message: "subjects retrieved successfully",
      data,
      statusCode: 200,
    });
  },
);
router.get(
  routes.getAllCourse,
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await courseService.getAllCourse();
    return successResult({
      res,
      message: "courses retrieved successfully",
      data,
      statusCode: 201,
    });
  },
);
router.get(
  "/:courseId",
  auth(),
  authorize([UserRole.STUDENT]),
  async (req: Request, res: Response) => {
    const data = await courseService.watchCourse(req.params.courseId as string, req.user.id as string);
    return successResult({ res, message: "course retrieved successfully", data, statusCode: 200 });
  },
);

router.post(
  routes.createCourse,
  auth(),
  authorize([UserRole.TEACHER, UserRole.ADMIN]),
  cloudFileUpload({ validation: fileFieldValidation.image }).single("file"),
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
