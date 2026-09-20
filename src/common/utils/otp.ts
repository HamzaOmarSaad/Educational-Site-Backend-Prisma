import { emailEnum } from "../../Enums";
import { badRequestException } from "../res";
import { redisService } from "../services";

const MAX_OTP_ATTEMPTS = 3;
const ATTEMPTS_TTL = 5 * 60;
const BLOCK_TTL = 7 * 60;

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const checkBlockedOTP = async (
  email: string,
  subject: emailEnum,
): Promise<void> => {
  const blockedKey = redisService.BlockedOTPKey({
    email,
    subject,
  });

  const ttl = await redisService.TTL({
    key: blockedKey,
  });

  if (ttl > 0) {
    throw new badRequestException(
      `Too many wrong attempts. Try again after ${ttl} seconds.`,
    );
  }
};

export const checkOTPCooldown = async (
  email: string,
  subject: emailEnum,
): Promise<void> => {
  const cooldownKey = redisService.OTPCooldownKey({
    email,
    subject,
  });

  const ttl = await redisService.TTL({
    key: cooldownKey,
  });

  if (ttl > 0) {
    throw new badRequestException(
      `Please wait ${ttl} seconds before requesting another OTP.`,
    );
  }
};

export const registerWrongOTPAttempt = async (
  email: string,
  subject: emailEnum,
): Promise<void> => {
  const attemptsKey = redisService.maxAttemptOTPKey({
    email,
    subject,
  });

  const blockedKey = redisService.BlockedOTPKey({
    email,
    subject,
  });

  const attempts = await redisService.incr(attemptsKey);

  // First wrong attempt: start expiration timer
  if (attempts === 1) {
    await redisService.expire({
      key: attemptsKey,
      ttl: ATTEMPTS_TTL,
    });
  }

  // Block after maximum attempts
  if (attempts >= MAX_OTP_ATTEMPTS) {
    await redisService.setValue({
      key: blockedKey,
      value: true,
      ttl: BLOCK_TTL,
    });

    await redisService.deleteValue({
      key: attemptsKey,
    });

    throw new badRequestException(
      `Too many wrong OTP attempts. You are blocked for ${BLOCK_TTL / 60} minutes.`,
    );
  }
};

export const clearOTPAttempts = async (
  email: string,
  subject: emailEnum,
): Promise<void> => {
  const attemptsKey = redisService.maxAttemptOTPKey({
    email,
    subject,
  });

  await redisService.deleteValue({
    key: attemptsKey,
  });
};
