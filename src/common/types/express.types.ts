import { Socket } from "socket.io";
import { JwtPayload } from "jsonwebtoken";
import { IUser } from "../../interfaces";

//declaration manager
declare module "express-serve-static-core" {
  interface Request {
    user: IUser;
    decoded: JwtPayload;
  }
}

export interface IAuthUser {
  user: IUser;
  decoded: JwtPayload;
}
export interface IAuthSocket extends Socket {
  data: IAuthUser;
}
