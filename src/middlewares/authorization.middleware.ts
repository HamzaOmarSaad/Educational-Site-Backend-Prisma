import { NextFunction, Response, Request } from "express";
import { RoleEnum } from "../Enums";
import {
  MapGraphQLError,
  unauthorizedException,
} from "../utils/res/exceptions/domain.exceptions";
import { HUser } from "../interfaces";

export const authorize = (roles: RoleEnum[] = []) => {
  async (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req?.user?.role)) {
      throw new unauthorizedException(" not authorized user ");
    }
    next();
  };
};
export const authorizeGQL = async (
  roles: RoleEnum[] = [],
  user: HUser,
): Promise<boolean> => {
  if (!roles.includes(user?.role)) {
    MapGraphQLError(new unauthorizedException(" not authorized user "));
  }
  return true;
};
