import {
  badRequestException,
  conflictException,
  EmailService,
  encryptService,
  hashService,
  verifyHashService,
} from "../../common";
import emailService from "../../common/email";
import {
  NotificationService,
  notificationService,
  redisService,
  TokenService,
} from "../../common/services";
import { emailEnum, logoutType } from "../../Enums";
import { UserRole } from "../../interfaces";
import { db } from "../../prisma/db";
import {
  academicYearRepository,
  AcademicYearRepository,
  gradeRepository,
  GradeRepository,
  trackRepository,
  TrackRepository,
  userRepository,
  UserRepository,
} from "../../repositories";
import {
  confirmEmailDTo,
  ILoginDTO,
  ISignupDTO,
  resendEmailDTO,
} from "./auth.dto";

export class AuthService {
  private userRepository: UserRepository;
  private gradeRepository: GradeRepository;
  private trackRepository: TrackRepository;
  private academicYearRepository: AcademicYearRepository;
  private redis: typeof redisService;
  private tokenService;
  private notificationService: NotificationService;
  private email: EmailService;

  constructor() {
    this.userRepository = userRepository;
    this.gradeRepository = gradeRepository;
    this.trackRepository = trackRepository;
    this.academicYearRepository = academicYearRepository;
    this.redis = redisService;
    this.tokenService = new TokenService();
    this.email = emailService;
    this.notificationService = notificationService;
  }

  async signup({
    name,
    password,
    email,
    phone,
    parentPhone,
    school,
    grade,
    track,
    gender,
  }: ISignupDTO) {
    const isEmail = await this.userRepository.findOne({ email });
    if (isEmail) {
      throw new badRequestException("email already exist");
    }
    const hashedPass = await hashService(password);
    const encryptedPhone = encryptService(phone as string);
    const encryptedParentPhone = encryptService(parentPhone as string);

    const studGrade = await this.gradeRepository.findOne({ name: grade });
    if (!studGrade) throw new conflictException("fail to find grade ");
    const studTrack = await this.trackRepository.findOne({ name: track });
    if (!studTrack) throw new conflictException("fail to find track ");
    const now = new Date();
    const year =
      now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
    const studAcademicYear = await this.academicYearRepository.findOne({
      year,
    });
    if (!studAcademicYear)
      throw new conflictException("fail to find academicYear ");

    const res = await db.transaction(async (tx) => {
      const user = await tx.orm.public.User.create({
        name,
        email,
        gender,
        role: UserRole.STUDENT,
        password: hashedPass,
        phone: encryptedPhone,
      });

      const student = await tx.orm.public.StudentProfile.create({
        parentPhone: encryptedParentPhone,
        school,
        userId: user.id,
        gradeId: studGrade.id,
        trackId: studTrack.id,
        academicYearId: studAcademicYear.id,
      });
      const wallet = await tx.orm.public.Wallet.create({
        studentId: user.id,
      });
      return { user, student, wallet };
    });

    await this.email.sendEmailOTP({
      email,
      subject: emailEnum.confirmEmail,
      title: "Email confirmation",
    });

    const { password: _, ...safeUser } = res.user;

    return {
      message: "Signup done. Confirm your email to proceed.",
      student: {
        ...safeUser,
        ...res.student,
      },
    };
  }
  public async login({ email, password, FCM }: ILoginDTO, issuer: string) {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new badRequestException("wrong credential ");
    }
    const passMatch = await verifyHashService(
      password,
      user.password as string,
    );
    if (!passMatch) {
      throw new badRequestException("wrong credential password");
    }
    const { accessToken, refreshToken } = this.tokenService.createLoginTokens({
      user: user,
      iss: issuer,
    });
    if (FCM) {
      await this.redis.addFCM(user.id, FCM);
      const tokens = await this.redis.getFCMs(user.id);
      if (tokens?.length) {
        this.notificationService.sendNotifications({
          tokens,
          data: {
            title: "login ",
            body: `new login is detected at ${Date.now()} `,
          },
        });
      }
    }

    return { accessToken, refreshToken, user };
  }

  async confirmEmail({ email, otp }: confirmEmailDTo) {
    const account = await this.userRepository.findOne({
      email,
      EmailConfirmedAt: null,
    });

    if (!account) {
      throw new badRequestException("Email not found or already confirmed.");
    }
    const confirmed = await this.email.verifyOTP(
      email,
      otp,
      emailEnum.confirmEmail,
    );
    // 6. Confirm email
    await this.userRepository.update({
      where: {
        email,
      },

      update: {
        EmailConfirmedAt: new Date(),
      },
    });
    console.log("🚀 ~ AuthService ~ confirmEmail ~ email:", email);
    return confirmed;
  }
  async resendEmail({ email }: resendEmailDTO) {
    const account = await this.userRepository.findOne({
      email,
      EmailConfirmedAt: null,
    });

    if (!account) {
      throw new badRequestException("Email not found or already confirmed.");
    }
    await this.email.sendEmailOTP({
      email,
      subject: emailEnum.confirmEmail,
      title: "Email Confirmation",
    });
  }
  async logout({
    userId,
    token,
    flag = logoutType.allDevices,
  }: {
    userId: string;
    token: string;
    flag: logoutType;
  }) {
    const decoded = this.tokenService.decode(token);
    if (flag == logoutType.allDevices) {
      await this.userRepository.update({
        where: { id: userId },
        update: { changedCredentialsTime: Date.now() },
      });
    } else {
      await this.tokenService.RevokeToken({
        userId,
        jti: decoded.jti as string,
        ttl: 7 * 24 * 60 * 60,
      });
    }

    return { data: true };
  }
  async rotateToken(refreshToken: string) {
    await this.tokenService.rotateToken(refreshToken);
  }
  async requestPasswordChange(email: string) {
    await this.email.sendEmailOTP({
      email,
      subject: emailEnum.forgetPass,
      title: "forgetPassword",
    });
  }
  async forgetPassword(email: string, newPassword: string, otp: string) {
    const isVerified = await this.email.verifyOTP(
      email,
      otp,
      emailEnum.forgetPass,
    );
    if (!isVerified) {
      throw new Error("wrong otp");
    }
    const newPass = hashService(newPassword);
    const user = await this.userRepository.update({
      where: { email },
      update: { password: newPass },
    });
    return user;
  }
}

const authService = new AuthService();
export default authService;
