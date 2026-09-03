import axios from "axios";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import redisService from "../services/redis.service";

const ipCountry = async (ip: any) => {
  try {
    const res = await axios.get(`https://ipapi.co/${ip}/json`);
    return res.data;
  } catch (err) {
    console.log("🚀 ~ ipCountry ~ err:", err);
  }
};

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: async function (req) {
    const { country_code } = (await ipCountry(req.ip)) || {};
    // const {country}= geoip.lookup(req.ip) another package but will need uninstall and reinstall once in a while
    return country_code == "EG" ? 5 : 3;
  }, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  skipFailedRequests: true,
  handler: (req, res, next) => {
    return res.status(408).json({
      message: "too many requests ",
    });
  },
  keyGenerator: (req, res) => {
    const ip = ipKeyGenerator(req.ip as string);
    return `${ip}-${req.path}`;
  },
  // to store no of trails
  store: {
    async incr(key, cb) {
      try {
        const count = await redisService.incr(key);
        if (count == 1) await redisService.expire({ key, ttl: 60 });
        cb(undefined, count, undefined);
      } catch (error) {
        cb(error as Error, 0, undefined);
      }
    },
    async decrement(key) {
      if (await redisService.exist(key)) await redisService.decr(key);
    },
    async resetKey(key) {
      await redisService.deleteValue({ key });
    },
  },
  // store: ... , // Redis, Memcached, etc. See below.
});
