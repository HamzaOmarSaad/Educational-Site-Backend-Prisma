import { NextFunction, Request, Response } from "express";
import redisService from "../utils/services/redis.service";

export const cachingMiddleware = (personal: boolean, ttl = 60) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }
    try {
      const key = redisService.cacheKey(
        req.originalUrl,
        personal ? req.user?._id : undefined,
      );

      // 1. Check cache
      const cachedData = await redisService.getValue(key);

      if (cachedData) {
        return res.status(200).json(cachedData);
      }

      // 2. Save original res.json
      const originalJson = res.json.bind(res);

      // 3. Override res.json
      res.json = (body: any) => {
        // Don't make the request wait for Redis
        void redisService.setValue({
          key,
          value: body,
          ttl,
        });

        // Send the response normally
        return originalJson(body);
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };
};
