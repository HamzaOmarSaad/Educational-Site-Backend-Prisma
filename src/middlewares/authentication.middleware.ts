import { TokenType, tokenTypeEnum } from "../utils/services/token.service";
import { NextFunction, Request, Response } from "express";
import { badRequestException } from "../utils/res/exceptions/domain.exceptions";
import { TokenService } from "../utils/services/token.service";

// export interface IRequest extends Request {
//   user?: HUser;
//   decoded?: JwtPayload;
// }
const tokenService = new TokenService();
export const auth = (tokenType: TokenType = tokenTypeEnum.access) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers["authorization"] as string | undefined;

    if (!authorization) {
      throw new badRequestException("No token provided");
    }

    const [start, token] = authorization.split(" ");
    if (start != "Bearer") {
      throw new badRequestException("wrong token format not bearer");
    }
    if (!token) {
      throw new badRequestException("No token is provided");
    }
    const { user, decoded } = await tokenService.decodeToken({
      token,
      tokenType: tokenType,
    });
    req.user = user;
    req.decoded = decoded;
    console.log("user authorized ", user.userName);

    next();
  };
};
