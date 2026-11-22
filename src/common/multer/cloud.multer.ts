import type { Request } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { extname } from "node:path";
import type { FileFilterCallback } from "multer";

import { badRequestException } from "../res";
import { storageApproachEnum } from "../../Enums/multer.enum";

export const fileFieldValidation = {
  image: ["image/png", "image/jpg", "image/jpeg", "image/webp"],

  video: ["video/mp4", "video/webm", "video/quicktime", "video/mkv", "video/matroska", "video/x-matroska", "application/x-matroska"],
  file: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  ],
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

    const isMatroska = extname(file.originalname).toLowerCase() === ".mkv" &&
      ["video/matroska", "video/x-matroska", "video/mkv", "application/x-matroska", "application/octet-stream"].includes(file.mimetype);
    if (isMatroska) {
      file.mimetype = "video/x-matroska";
    } else if (!validation.includes(file.mimetype)) {
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
    storageApproach === storageApproachEnum.MEMO
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

    limits: {
      fileSize: maxSize * 1024 * 1024,
    },
  });
};
