import { NextFunction, Request, Response, Router } from "express";
import { routes } from "./admin.routes";
import { UserRole } from "../../interfaces";
import { auth, authorize, validate } from "../../middlewares";
import { createTeacherSchema } from "./admin.validation";
import { createTeacherDTO } from "./admin.dto";
import { successResult } from "../../common";
import adminService from "./admin.service";
import { cloudFileUpload, fileFieldValidation } from "../../common/multer";

const router = Router();
router.post(
  routes.createTeacher,
  auth(),
  authorize([UserRole.ADMIN]),
  validate(createTeacherSchema),
  cloudFileUpload({ validation: fileFieldValidation.image }).single(
    "attachment",
  ),
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

export default router;
