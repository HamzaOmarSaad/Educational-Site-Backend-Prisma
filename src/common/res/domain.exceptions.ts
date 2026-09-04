import { GraphQLError } from "graphql";
import { AppError } from "./error.handle";
import { ZodIssue } from "zod";

export const MapGraphQLError = (err: AppError) => {
  throw new GraphQLError(err.message || "internal server error", {
    extensions: { statusCode: err.statusCode || 500, cause: err.cause },
  });
};
export class NotFoundException extends AppError {
  constructor(message?: string, options?: ErrorOptions) {
    super(message || "not found ", 404, options);
  }
}
export class badRequestException extends AppError {
  constructor(message: string, options?: any) {
    super(message, 400, options);
  }
}
export class conflictException extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 409, options);
  }
}

export class ValidationException extends AppError {
  constructor(public validationErrors: ZodIssue[]) {
    super("Validation Failed", 400);

    Object.setPrototypeOf(this, ValidationException.prototype);
  }
}

export class unauthorizedException extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 401, options);
  }
}
