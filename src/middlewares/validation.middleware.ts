import { NextFunction, Request, Response } from "express";
import * as z from "zod";
import { ZodIssue } from "zod";
import {
  badRequestException,
  MapGraphQLError,
  ValidationException,
} from "../utils/res/exceptions/domain.exceptions";

type RequestKey = keyof Request;
type SchemaType = Partial<Record<RequestKey, z.ZodTypeAny>>;

export const validationMiddleware = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const issues: ZodIssue[] = [];

    const keys = Object.keys(schema) as RequestKey[];

    for (const key of keys) {
      const validator = schema[key];

      if (!validator) continue;
      if (req.file) {
        req.body.file = req.file;
      }
      if (req.files) {
        req.body.files = req.files;
      }

      const validationResult = validator.safeParse(req[key]);

      if (!validationResult.success) {
        issues.push(...validationResult.error.issues);
      }
    }

    if (issues.length) {
      return next(new ValidationException(issues));
    }

    return next();
  };
};
export const validationGQL = async <T>(schema: z.ZodType, args: T) => {
  const validationResult = schema.safeParse(args);
  if (!validationResult.success) {
    throw MapGraphQLError(
      new badRequestException("validation error", {
        issues: validationResult.error.issues.map((issue) => {
          return { path: issue.path, message: issue.message };
        }),
      }),
    );
  }
  return true;
};
export const validationSocket = async <T>(schema: z.ZodType, args: T) => {
  const validationResult = schema.safeParse(args);
  if (!validationResult.success) {
    new badRequestException("validation error", {
      issues: validationResult.error.issues.map((issue) => {
        return { path: issue.path, message: issue.message };
      }),
    });
  }
  return true;
};
