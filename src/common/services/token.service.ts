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
import { userRepository } from "../../repositories";

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

  public decode(token: string): JwtPayload {
    const decoded = jwt.decode(token);

    if (!decoded || typeof decoded === "string") {
      throw new badRequestException("Invalid token");
    }

    return decoded;
  }
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
  public getAudience(decoded: Record<string, any>, tokenType: TokenType) {
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
    return { tokenApproach, role };
  }
  public createAccessToken({
    userId,
    role,
    issuer,
  }: {
    userId: string;
    role: UserRole;
    issuer: string;
  }): string {
    return this.sign({
      secret: this.getSignature(role, tokenTypeEnum.access),

      payload: {
        sub: userId,
        role,
        tokenType: tokenTypeEnum.access,
      },

      options: {
        expiresIn: ACCESS_EXPIRES_IN,
        issuer,
        jwtid: crypto.randomUUID(),
        audience: [tokenTypeEnum.access, role],
      },
    });
  }
  public createRefreshToken({
    userId,
    role,
    issuer,
  }: {
    userId: string;
    role: UserRole;
    issuer: string;
  }): string {
    return this.sign({
      secret: this.getSignature(role, tokenTypeEnum.refresh),

      payload: {
        sub: userId,
        role,
        tokenType: tokenTypeEnum.refresh,
      },

      options: {
        expiresIn: REFRESH_EXPIRES_IN,
        issuer,
        jwtid: crypto.randomUUID(),
        audience: [tokenTypeEnum.refresh, role],
      },
    });
  }
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
  private validateCredentials(user: any, iat?: number): void {
    if (
      user.changedCredentialsTime &&
      iat &&
      Number(user.changedCredentialsTime) >= iat * 1000
    ) {
      throw new badRequestException(
        "Credentials have been changed log in again ",
      );
    }
  }

  private getRemainingTTL(exp?: number): number {
    if (!exp) {
      throw new badRequestException("Token has no expiration");
    }

    const now = Math.floor(Date.now() / 1000);

    const ttl = exp - now;

    if (ttl <= 0) {
      throw new badRequestException("Token has expired");
    }

    return ttl;
  }

  async isRevoked(userId: string, jti: string): Promise<boolean> {
    if (!userId) {
      throw new badRequestException("Token has no user ID");
    }

    if (!jti) {
      throw new badRequestException("Token has no JTI");
    }

    const key = this.redisService.revokeTokenGenerator({
      userId,
      jti,
    });

    const revoked = await this.redisService.getValue(key);

    return !!revoked;
  }
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
  public decodeToken = async ({
    token,
    tokenType,
  }: {
    token: string;
    tokenType: TokenType;
  }): Promise<{ user: any; decoded: JwtPayload }> => {
    const decoded = this.decode(token);
    if (!decoded) {
      throw new badRequestException("token is not correct  ");
    }
    const { tokenApproach, role } = this.getAudience(decoded, tokenType);
    await this.isRevoked(decoded.sub as string, decoded.jti as string);

    const secret = this.getSignature(
      role as unknown as UserRole,
      tokenApproach,
    );
    const verifiedData = this.verify({ token, secret, tokenType });

    const user = await userRepository.findById(verifiedData.sub as string);

    if (!user) {
      throw new badRequestException("No user with these credentials ");
    }

    this.validateCredentials(user, verifiedData.iat);
    //!6)inject user info into request to be used in operations
    return { decoded: verifiedData, user };
  };
  public async rotateToken(refreshToken: string) {
    const decoded = this.decode(refreshToken);

    const { tokenApproach, role } = this.getAudience(
      decoded,
      tokenTypeEnum.refresh,
    );

    const secret = this.getSignature(role, tokenTypeEnum.refresh);

    const verified = this.verify({
      token: refreshToken,
      tokenType: tokenApproach,
      secret,
    });

    const revoked = await this.isRevoked(
      decoded.sub as string,
      decoded.jti as string,
    );

    if (revoked) {
      throw new badRequestException("Refresh token has been revoked");
    }

    const user = await userRepository.findById(decoded.sub as string);

    if (!user) {
      throw new badRequestException("User not found");
    }

    this.validateCredentials(user, verified.iat);

    const ttl = this.getRemainingTTL(verified.exp);

    await this.RevokeToken({
      userId: decoded.sub as string,
      jti: decoded.jti as string,
      ttl,
    });

    return this.createLoginTokens({
      user: { id: user.id, role: user.role },
      iss: verified.iss as string,
    });
  }
}
