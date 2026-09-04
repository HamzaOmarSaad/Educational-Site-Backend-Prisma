import type { Request } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";

import type { FileFilterCallback } from "multer";
import { badRequestException } from "../res";
import { storageApproachEnum } from "../../Enums/multer.enum";

export const fileFieldValidation = {
  image: ["image/png", "image/jpg", "image/jpeg"],
  video: ["video/mp4", "video/webm"],
};

export const fileFilter = (validation: string[]) => {
  return function (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) {
    if (!validation.length) {
      return cb(null, true);
    }

    if (!validation.includes(file.mimetype)) {
      return cb(
        new badRequestException(`Invalid file type: ${file.mimetype}`) as Error,
      );
    }

    return cb(null, true);
  };
};

export const cloudFileUpload = ({
  storageApproach = storageApproachEnum.MEMO,
  validation = [],
  maxSize = 5,
}: {
  storageApproach?: storageApproachEnum;
  validation?: string[];
  maxSize?: number;
}) => {
  const storage =
    storageApproach == storageApproachEnum.MEMO
      ? multer.memoryStorage()
      : multer.diskStorage({
          filename(
            req: Request,
            file: Express.Multer.File,
            callback: (error: Error | null, destination: string) => void,
          ) {
            callback(null, `${randomUUID()}__${file.originalname}`);
          },
          destination(
            req: Request,
            file: Express.Multer.File,
            callback: (error: Error | null, destination: string) => void,
          ) {
            callback(null, tmpdir());
          },
        });
  return multer({
    fileFilter: fileFilter(validation),
    storage,
    limits: { fileSize: maxSize * 1024 * 1024 },
  });
};
