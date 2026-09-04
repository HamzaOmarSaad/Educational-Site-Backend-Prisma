import { IUser, UserRole } from "./../interfaces";
import { NextFunction, Response, Request } from "express";
import { MapGraphQLError, unauthorizedException } from "../common";

export const authorize = (roles: UserRole[] = []) => {
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req?.user?.role)) {
      throw new unauthorizedException(" not authorized user ");
    }
    next();
  };
};
export const authorizeGQL = async (
  roles: UserRole[] = [],
  user: IUser,
): Promise<boolean> => {
  if (!roles.includes(user?.role)) {
    MapGraphQLError(new unauthorizedException(" not authorized user "));
  }
  return true;
};
