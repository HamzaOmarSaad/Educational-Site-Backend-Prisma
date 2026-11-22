import { NextFunction, Request, Response, Router } from "express";
import { routes } from "./admin.routes";
import { UserRole } from "../../interfaces";
import { auth, authorize, validate } from "../../middlewares";
import { createTeacherSchema, updateTeacherSchema } from "./admin.validation";
import { createTeacherDTO } from "./admin.dto";
import { successResult } from "../../common";
import adminService from "./admin.service";
import { cloudFileUpload, fileFieldValidation } from "../../common/multer";

const router = Router();
router.get(
  routes.teachers,
  auth(),
  authorize([UserRole.ADMIN]),
  async (_req: Request, res: Response) => {
    const data = await adminService.getTeachers();
    return successResult({
      res,
      message: "teachers retrieved successfully",
      data,
      statusCode: 200,
    });
  },
);
router.post(
  routes.createTeacher,
  auth(),
  authorize([UserRole.ADMIN]),
  cloudFileUpload({ validation: fileFieldValidation.image }).single(
    "attachment",
  ),
  validate(createTeacherSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await adminService.createTeacher({
      ...req.body,
      file: req.file,
    } as createTeacherDTO);
    return successResult({
      res,
      message: "user created successfully",
      data,
      statusCode: 201,
    });
  },
);

router.patch(
  routes.teacher,
  auth(),
  authorize([UserRole.ADMIN]),
  validate(updateTeacherSchema),
  async (req: Request, res: Response) => {
    const data = await adminService.updateTeacher(
      req.params.teacherId as string,
      req.body,
    );
    return successResult({
      res,
      message: "teacher updated successfully",
      data,
      statusCode: 200,
    });
  },
);

router.delete(
  routes.teacher,
  auth(),
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    const data = await adminService.deleteTeacher(
      req.params.teacherId as string,
    );
    return successResult({
      res,
      message: "teacher deactivated successfully",
      data,
      statusCode: 200,
    });
  },
);

export default router;
