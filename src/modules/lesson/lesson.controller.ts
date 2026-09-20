import { NextFunction, Request, Response, Router } from "express";
import { auth, authorize, validate } from "../../middlewares";
import { UserRole } from "../../interfaces";
import lessonService from "./lesson.service";
import {
  createLessonAttachmentsSchema,
  createLessonVideoSchema,
} from "./lesson.validation";
import { cloudFileUpload, fileFieldValidation } from "../../common/multer";
import { storageApproachEnum } from "../../Enums";
import { successResult } from "../../common";
import { createLessonAttachmentDTO, createLessonVideoDTO } from "./lesson.dto";

const router = Router();

router.post(
  "/create-lesson-video",
  auth(),
  authorize([UserRole.TEACHER]),
  validate(createLessonVideoSchema),
  cloudFileUpload({
    storageApproach: storageApproachEnum.DESK,
    validation: fileFieldValidation.video,
  }).single("video"),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await lessonService.createLessonVideo({
      ...req.body,
      file: req.file,
    } as createLessonVideoDTO);
    return successResult({
      res,
      data,
      message: "lesson video created",
      statusCode: 201,
    });
  },
);
router.post(
  "/create-lesson-attachment",
  auth(),
  authorize([UserRole.TEACHER]),
  validate(createLessonAttachmentsSchema),
  cloudFileUpload({
    storageApproach: storageApproachEnum.DESK,
    validation: fileFieldValidation.file,
  }).single("attachment"),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await lessonService.createLessonAttachment({
      ...req.body,
      file: req.file,
    } as createLessonAttachmentDTO);
    return successResult({
      res,
      data,
      message: "lesson attachment created",
      statusCode: 201,
    });
  },
);
export default router;
