import { createClient, RedisClientType } from "redis";
import { REDIS_DB_NAME, REDIS_DB_URI } from "../../env/config";
import { emailEnum, redisPurposeEnum } from "../../Enums";
import { badRequestException } from "../res";
// singleton pattern
type redisOtpType = {
  email: string;
  subject: emailEnum;
};
export class RedisService {
  private readonly redisClient: RedisClientType;
  constructor() {
    this.redisClient = createClient({
      url: REDIS_DB_URI,
      database: REDIS_DB_NAME,
    });
    this.handleEvents();
  }

  /**----------------connection ------------------------------ */
  public connectRedisDB = async () => {
    try {
      await this.redisClient.connect();
      console.log("✅ Redis connected successfully");
    } catch (error) {
      console.log("🚀 redis connectDB ~ error:", error);
    }
  };

  private handleEvents() {
    this.redisClient.on("error", (error) => {
      console.log("🚀  RedisService has error:", error);
    });
    this.redisClient.on("ready", () => {
      console.log("🚀 RedisService is ready");
    });
  }

  /**----------------------keys----------------------------------- */
  public keyPrefixGenerator = ({
    purpose,
    identifier,
  }: {
    purpose: redisPurposeEnum;
    identifier: string;
  }) => {
    return `User::${purpose}::${identifier}`;
  };

  public OTPKey = ({
    email,
    subject = emailEnum.confirmEmail,
  }: redisOtpType): string => {
    return `${this.keyPrefixGenerator({ purpose: redisPurposeEnum.OTP, identifier: `${email}::${subject}` })}`;
  };
  public FCMKey(userId: string) {
    return `user:FCM:${userId}`;
  }
  public socketKey(userId: string) {
    return `user:sockets:${userId}`;
  }
  public cacheKey(value: string, userId?: string) {
    return userId ? `REQUEST::${value}::${userId}` : `REQUEST::${value}`;
  }

  public maxAttemptOTPKey = ({
    email,
    subject = emailEnum.confirmEmail,
  }: redisOtpType): string => {
    return `${this.keyPrefixGenerator({ purpose: redisPurposeEnum.OTP, identifier: `${email}::${subject}` })}::maxTrail`;
  };
  public BlockedOTPKey = ({
    email,
    subject = emailEnum.confirmEmail,
  }: redisOtpType): string => {
    return `${this.keyPrefixGenerator({ purpose: redisPurposeEnum.OTP, identifier: `${email}::${subject}` })}::blocked`;
  };

  public revokeTokenGenerator = ({
    jti,
    userId,
  }: {
    jti: string;
    userId: string;
  }): string => {
    return `${this.keyPrefixGenerator({ purpose: redisPurposeEnum.revokeToken, identifier: userId as unknown as string })}::${jti}`;
  };
  /**-------------------general operations ------------------------------------ */
  public setValue = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: any;
    ttl: number | undefined;
  }): Promise<string | null> => {
    try {
      const data = JSON.stringify(value);
      if (ttl) {
        return await this.redisClient.set(key, data, {
          expiration: { value: ttl, type: "EX" },
        });
      } else {
        return await this.redisClient.set(key, data);
      }
    } catch (err) {
      console.log("🚀 ~ RedisService ~ err:", err);
      return null;
    }
  };
  public async getValue<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      throw new badRequestException("Redis get error");
    }
  }
  public updateValue = async ({
    key,
    newValue,
    ttl,
  }: {
    key: string;
    newValue: string | object;
    ttl: number | undefined;
  }): Promise<string | null | number> => {
    try {
      const exist = await this.redisClient.exists(key);
      if (!exist) {
        return null;
      }
      return await this.setValue({ key, value: newValue, ttl });
    } catch (error) {
      throw new badRequestException("redis set Error");
    }
  };
  public deleteValue = async ({
    key,
  }: {
    key: string | string[];
  }): Promise<null | number> => {
    try {
      const data = await this.redisClient.del(key);
      return data;
    } catch (error) {
      throw new badRequestException("redis set Error");
    }
  };

  public expire = async ({
    key,
    ttl,
  }: {
    key: string;
    ttl: number;
  }): Promise<null | number> => {
    try {
      const data = await this.redisClient.expire(key, ttl);
      return data;
    } catch (error) {
      throw new badRequestException("redis set Error");
    }
  };

  public TTL = async ({ key }: { key: string }): Promise<number> => {
    try {
      return await this.redisClient.ttl(key);
    } catch (error) {
      throw new badRequestException("redis set Error");
    }
  };

  public async incr(key: string): Promise<number> {
    try {
      return await this.redisClient.incr(key);
    } catch (error) {
      throw new badRequestException("redis incr Error");
    }
  }
  public async decr(key: string): Promise<number> {
    try {
      return await this.redisClient.decr(key);
    } catch (error) {
      throw new badRequestException("redis incr Error");
    }
  }
  public async exist(key: string): Promise<number> {
    try {
      return await this.redisClient.exists(key);
    } catch (error) {
      throw new badRequestException("redis exist Error" + error);
    }
  }
  public GetByPrefix = async (pattern: string): Promise<string[]> => {
    try {
      return await this.redisClient.keys(pattern);
    } catch (error) {
      throw new badRequestException("redis GetByPrefix Error");
    }
  };
  /**--------------------sockets operations ------------------------------------------------ */
  async addSocket(userId: string, socketId: string) {
    return await this.redisClient.sAdd(this.socketKey(userId), socketId);
  }

  async removeSocket(userId: string, socketId: string) {
    return await this.redisClient.sRem(this.socketKey(userId), socketId);
  }

  async getSockets(userId: string) {
    return await this.redisClient.sMembers(this.socketKey(userId));
  }

  async hasSockets(userId: string) {
    return await this.redisClient.sCard(this.socketKey(userId));
  }

  async removeUser(userId: string) {
    return await this.redisClient.del(this.socketKey(userId));
  }
  /**--------------------------notification token operations---------------------------------------------------- */
  async addFCM(userId: string, FCMToken: string) {
    return await this.redisClient.sAdd(this.FCMKey(userId), FCMToken);
  }

  async removeFCM(userId: string, FCMToken: string) {
    return await this.redisClient.sRem(this.FCMKey(userId), FCMToken);
  }

  async getFCMs(userId: string) {
    return await this.redisClient.sMembers(this.FCMKey(userId));
  }
  /**---------------------------------caching----------------------------------------------------------- */
  async clearCache(url: string, userId: string) {
    await this.deleteValue({
      key: this.cacheKey(url, userId),
    });
  }
}
const redisService = new RedisService();

export default redisService;
