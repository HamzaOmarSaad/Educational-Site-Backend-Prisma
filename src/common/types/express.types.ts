import { Socket } from "socket.io";
import { HUser } from "./../../interfaces";
import { JwtPayload } from "jsonwebtoken";

//declaration manager
declare module "express-serve-static-core" {
  interface Request {
    user: HUser;
    decoded: JwtPayload;
  }
}

export interface IAuthUser {
  user: HUser;
  decoded: JwtPayload;
}
export interface IAuthSocket extends Socket {
  data: IAuthUser;
}
