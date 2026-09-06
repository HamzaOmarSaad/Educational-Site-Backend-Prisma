import { emailEnum } from "../../Enums";
import { badRequestException } from "../res";
import redisService from "../services";

export const generateOTP = () => {
  return Math.floor(Math.random() * 900000 + 100000);
};
export const checkBlockedOTP = async (email: string, subject: emailEnum) => {
  const blockedKey = redisService.BlockedOTPKey({
    email,
    subject,
  });
  const isBlockedTTL = await redisService.TTL({
    key: blockedKey,
  });

  if (isBlockedTTL > 0) {
    throw new badRequestException(
      `Sorry, you are blocked. Try again after ${isBlockedTTL} seconds`,
    );
  }
};
export const checkActiveOTP = async (otpKey: string) => {
  const remainingOtpTTL = await redisService.TTL({
    key: otpKey,
  });

  if (remainingOtpTTL > 0) {
    throw new badRequestException(
      `Current OTP still active. Try again after ${remainingOtpTTL} seconds`,
    );
  }
};
export const checkOTPAttempts = async (email: string, subject: emailEnum) => {
  const blockedKey = redisService.BlockedOTPKey({
    email,
    subject,
  });
  const attemptsKey = redisService.maxAttemptOTPKey({
    email,
    subject,
  });

  const attempts = await redisService.incr(attemptsKey);

  if (attempts === 1) {
    await redisService.expire({ key: attemptsKey, ttl: 300 });
  }

  if (attempts > 3) {
    await redisService.setValue({
      key: blockedKey,
      value: 1,
      ttl: 7 * 60,
    });

    throw new badRequestException("Sorry, you have reached the limit");
  }
};
