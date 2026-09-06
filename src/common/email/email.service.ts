// Services/sendEmail.ts

import nodemailer from "nodemailer";
import { badRequestException } from "../res";
import { hashService, verifyHashService } from "../security";
import { userRepository, UserRepository } from "../../repositories";
import redisService from "../services/redis.service";
import { emailEnum } from "../../Enums";
import {
  checkActiveOTP,
  checkBlockedOTP,
  checkOTPAttempts,
  generateOTP,
} from "../utils";
import { email_template, emailEvent } from ".";
interface SendEmailOptions {
  to: string;
  cc?: string;
  subject: string;
  html: string;
}

export class EmailService {
  private userRepository: UserRepository;
  private redis: typeof redisService;

  constructor() {
    this.userRepository = userRepository;
    this.redis = redisService;
  }
  private createTransporter() {
    if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
      throw new Error("Missing EMAIL environment variables");
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });
    return transporter;
  }
  public async sendEmail({ to, cc, subject, html }: SendEmailOptions) {
    try {
      const transporter = this.createTransporter();
      const info = await transporter.sendMail({
        from: `"Social Media App" <${process.env.EMAIL}>`,
        to,
        cc,
        subject,
        html,
      });

      console.log("Email sent:", info.accepted);

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
  }) {
    const otpKey = this.redis.OTPKey({
      email,
      subject,
    });
    // check if blocked
    await checkBlockedOTP(email, subject);
    // check if otp is active
    await checkActiveOTP(otpKey);
    // check for no of attempts
    await checkOTPAttempts(email, subject);

    const code = generateOTP();

    await this.redis.setValue({
      key: otpKey,
      value: await hashService(String(code)),
      ttl: 120,
    });

    emailEvent.publish("confirm-Email", {
      to: email,
      subject: title,
      html: email_template({
        message: String(code),
        title,
      }),
    });
  }
  public async confirmEmail(email: string, otp: string) {
    const key: string = this.redis.OTPKey({
      email,
      subject: emailEnum.confirmEmail,
    });
    // get  value of  the otp saved in redis  that we sent  and  hashed earlier
    const hashed = await this.redis.getValue<string>(key);

    if (!hashed) {
      throw new badRequestException(`wrong otp`);
    }
    // check email correctness and not confirmed yet
    const account = await this.userRepository.findOne({
      email,
      EmailConfirmedAt: null,
    });
    if (!account) {
      throw new badRequestException(` email not found  `);
    }
    // compare OTPs
    const match = await verifyHashService(otp.toString(), hashed);

    if (!match) {
      throw new badRequestException(`wrong otp`);
    }
    //confirm email is done
    await this.userRepository.update({
      where: { email },
      update: { EmailConfirmedAt: new Date() },
    });

    await this.redis.deleteValue({ key });

    return true;
  }
  public async resendEmail(email: string) {
    // check email correctness
    const account = await this.userRepository.findOne({
      email,
      EmailConfirmedAt: null,
    });
    if (!account) {
      throw new badRequestException(` email not found  `);
    }
    await this.sendEmailOTP({
      email,
      subject: emailEnum.confirmEmail,
      title: "email confirmation",
    });
    return;
  }
}
const emailService = new EmailService();
export default emailService;
