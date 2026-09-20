import nodemailer from "nodemailer";

import { badRequestException } from "../res";
import { hashService, verifyHashService } from "../security";

import redisService from "../services/redis.service";

import { emailEnum } from "../../Enums";

import {
  checkBlockedOTP,
  checkOTPCooldown,
  clearOTPAttempts,
  generateOTP,
  registerWrongOTPAttempt,
} from "../utils";

import { email_template } from "./generateHTML";

interface SendEmailOptions {
  to: string;
  cc?: string;
  subject: string;
  html: string;
}

const OTP_TTL = 3 * 60;
const OTP_COOLDOWN_TTL = 60;

export class EmailService {
  private redis: typeof redisService;

  constructor() {
    this.redis = redisService;
  }

  private createTransporter() {
    if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
      throw new Error("Missing EMAIL or EMAIL_PASS environment variables");
    }

    return nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  public async sendEmail({ to, cc, subject, html }: SendEmailOptions) {
    try {
      const transporter = this.createTransporter();

      const info = await transporter.sendMail({
        from: `"edusite App" <${process.env.EMAIL}>`,
        to,
        cc,
        subject,
        html,
      });

      console.log("Email sent successfully:", info.accepted);

      return info;
    } catch (error) {
      console.error("Email sending failed:", error);

      throw error;
    }
  }

  public async sendEmailOTP({
    email,
    subject,
    title,
  }: {
    email: string;
    subject: emailEnum;
    title: string;
  }): Promise<boolean> {
    // 1. Check if user is blocked
    await checkBlockedOTP(email, subject);

    // 2. Check resend cooldown
    await checkOTPCooldown(email, subject);

    // 3. Generate OTP
    const code = generateOTP();

    // 4. Generate Redis keys
    const otpKey = this.redis.OTPKey({
      email,
      subject,
    });

    const cooldownKey = this.redis.OTPCooldownKey({
      email,
      subject,
    });

    // 5. Hash OTP
    const hashedOTP = await hashService(code);

    // 6. Save OTP
    await this.redis.setValue({
      key: otpKey,
      value: hashedOTP,
      ttl: OTP_TTL,
    });

    // 7. Prevent immediate resend
    await this.redis.setValue({
      key: cooldownKey,
      value: true,
      ttl: OTP_COOLDOWN_TTL,
    });

    // 8. Send email
    await this.sendEmail({
      to: email,
      subject: title,
      html: email_template({
        message: code,
        title,
      }),
    });

    console.log(`OTP sent to ${email}`);

    return true;
  }

  public async verifyOTP(
    email: string,
    otp: string,
    subject: emailEnum,
  ): Promise<boolean> {
    // 1. Check if blocked
    await checkBlockedOTP(email, subject);
    // 2. Get OTP key
    const otpKey = this.redis.OTPKey({
      email,
      subject,
    });
    // 3. Get hashed OTP
    const hashedOTP = await this.redis.getValue<string>(otpKey);

    if (!hashedOTP) {
      throw new badRequestException("OTP is invalid or expired.");
    }

    // 5. Compare OTP
    const isMatch = await verifyHashService(otp, hashedOTP);

    if (!isMatch) {
      await registerWrongOTPAttempt(email, subject);
      throw new badRequestException("Wrong OTP.");
    }
    // 7. Delete OTP
    await this.redis.deleteValue({
      key: otpKey,
    });

    // 8. Clear failed attempts
    await clearOTPAttempts(email, subject);

    return true;
  }
}

const emailService = new EmailService();

export default emailService;
