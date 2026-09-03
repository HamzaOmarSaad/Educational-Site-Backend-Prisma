import { $ZodIssue } from "zod/v4/core";
import { Response } from "express";

export interface IAppError extends Error {
  statusCode?: number;
  validationError?: $ZodIssue[];
}
export interface ISuccess {
  res: Response;
  data?: any;
  statusCode?: number;
  message?: string;
}
