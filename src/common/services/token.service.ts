import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import {
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  SYSTEM_JWT_REFRESH_SECRET,
  SYSTEM_JWT_SECRET,
  USER_JWT_REFRESH_SECRET,
  USER_JWT_SECRET,
} from "../../env/config";
import redisService from "./redis.service";
import { badRequestException } from "../res";
import { UserRole } from "../../interfaces";
import userRepository from "../../repos/user.repo";

export const tokenTypeEnum = {
  access: "access",
  refresh: "refresh",
} as const;

export type TokenType = keyof typeof tokenTypeEnum;

type TokenInputType = {
  payload: object;
  options?: SignOptions;
  tokenType?: TokenType;
  secret?: string;
};
type TokenVerifyType = {
  token: string;
  tokenType: TokenType;
  secret: string;
};

export class TokenService {
  private redisService;
  constructor() {
    this.redisService = redisService;
  }
  public sign({
    payload,
    options = {},
    secret = USER_JWT_SECRET,
  }: TokenInputType): string {
    return jwt.sign(payload, secret, {
      ...options,
    });
  }
  public verify = ({
    token,
    tokenType = tokenTypeEnum.access,
    secret = USER_JWT_SECRET,
  }: TokenVerifyType): jwt.JwtPayload => {
    try {
      if (tokenType === "access" || tokenType === "refresh") {
        return jwt.verify(token, secret) as jwt.JwtPayload;
      }

      throw new badRequestException("Invalid token type");
    } catch (err: any) {
      throw new badRequestException(
        `Token verification failed + ${err.message}`,
      );
    }
  };
  public getSignature = (role: UserRole, tokenType: TokenType): string => {
    if (role == UserRole.ADMIN) {
      if (tokenType == tokenTypeEnum.access) {
        return SYSTEM_JWT_SECRET;
      } else {
        return SYSTEM_JWT_REFRESH_SECRET;
      }
    }
    if (role == UserRole.STUDENT || role == UserRole.TEACHER) {
      if (tokenType == tokenTypeEnum.access) {
        return USER_JWT_SECRET;
      } else {
        return USER_JWT_REFRESH_SECRET;
      }
    }
    return "";
  };

  public createLoginTokens = ({ iss, user }: { iss: string; user: any }) => {
    const jwtId = crypto.randomUUID();
    const accessSecret = this.getSignature(user.role, tokenTypeEnum.access);
    const refreshSecret = this.getSignature(user.role, tokenTypeEnum.refresh);

    const accessToken = this.sign({
      payload: { sub: user.id },
      tokenType: tokenTypeEnum.access,
      secret: accessSecret,

      options: {
        expiresIn: ACCESS_EXPIRES_IN,
        issuer: iss,
        jwtid: jwtId,
        audience: [tokenTypeEnum.access, user.role as unknown as string],
      },
    });
    const refreshToken = this.sign({
      payload: { sub: user.id },
      tokenType: tokenTypeEnum.refresh,
      secret: refreshSecret,

      options: {
        expiresIn: REFRESH_EXPIRES_IN,
        issuer: iss,
        jwtid: jwtId,
        audience: [tokenTypeEnum.refresh, user.role as unknown as string],
      },
    });

    return { accessToken, refreshToken };
  };
  public decodeToken = async ({
    token,
    tokenType,
  }: {
    token: string;
    tokenType: TokenType;
  }): Promise<{ user: any; decoded: JwtPayload }> => {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded?.aud?.length) {
      throw new badRequestException("missing token audience ");
    }
    const audience = Array.isArray(decoded.aud) ? decoded.aud : [decoded.aud];
    const [tokenApproach, role] = audience;

    if (!tokenApproach || !role) {
      throw new badRequestException("missing token audience ");
    }
    if (tokenApproach != tokenType) {
      throw new badRequestException(" wrong  token type ");
    }
    const isBanned = await this.redisService.getValue(
      this.redisService.revokeTokenGenerator({
        userId: decoded.sub as string,
        jti: decoded.jti as string,
      }),
    );

    if (isBanned) {
      throw new badRequestException("user is banned");
    }

    const secret = this.getSignature(
      role as unknown as UserRole,
      tokenApproach,
    );
    const verifiedData = this.verify({ token, secret, tokenType });

    const user = await userRepository.findById(verifiedData.sub as string);

    if (!user) {
      throw new badRequestException("No user with these credentials ");
    }

    if (
      user.changedCredentialsTime &&
      verifiedData.iat &&
      user.changedCredentialsTime.epochMilliseconds >= verifiedData.iat * 1000
    ) {
      throw new badRequestException("credentials is changed");
    }
    //!6)inject user info into request to be used in operations
    return { decoded: verifiedData, user };
  };
  async RevokeToken({
    userId,
    jti,
    ttl,
  }: {
    userId: string;
    jti: string;
    ttl: number;
  }) {
    const key = redisService.revokeTokenGenerator({ jti, userId });
    await redisService.setValue({
      key,
      value: true,
      ttl,
    });
  }
}
