import {
  badRequestException,
  conflictException,
  EmailService,
  encryptService,
  hashService,
  verifyHashService,
} from "../../common";
import emailService from "../../common/email";
import redisService, {
  NotificationService,
  notificationService,
  TokenService,
} from "../../common/services";
import { emailEnum } from "../../Enums";
import { UserRole } from "../../interfaces";
import {
  academicYearRepository,
  AcademicYearRepository,
  gradeRepository,
  GradeRepository,
  studentProfileRepository,
  StudentProfileRepository,
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
  private studentRepository: StudentProfileRepository;
  private gradeRepository: GradeRepository;
  private trackRepository: TrackRepository;
  private academicYearRepository: AcademicYearRepository;
  private redis: typeof redisService;
  private tokenService;
  private notificationService: NotificationService;
  private email: EmailService;
  constructor() {
    this.studentRepository = studentProfileRepository;
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

    const user = await this.userRepository.create({
      name,
      email,
      gender,
      role: UserRole.STUDENT,
      password: hashedPass,
      phone: encryptedPhone,
    });
    if (!user) throw new conflictException("fail");
    const studGrade = await this.gradeRepository.findOne({ name: grade });
    if (!studGrade) throw new conflictException("fail to find grade ");
    const studTrack = await this.trackRepository.findOne({ name: track });
    if (!studTrack) throw new conflictException("fail to find track ");
    let year = new Date().getFullYear();
    if (new Date().getMonth() > 7) {
      year++;
    }
    const studAcademicYear = await this.academicYearRepository.findOne({
      year,
    });
    if (!studAcademicYear)
      throw new conflictException("fail to find academicYear ");

    const student = await this.studentRepository.create({
      parentPhone: encryptedParentPhone,
      school,
      userId: user.id,
      gradeId: studGrade.id,
      trackId: studTrack.id,
      academicYearId: studAcademicYear.id,
    });
    if (!student) {
      this.userRepository.deleteById(user.id);
      throw new badRequestException("failed to create your account  ");
    }
    await this.email.sendEmailOTP({
      email,
      subject: emailEnum.confirmEmail,
      title: "Email confirmation",
    });

    return { message: " signup done login to proceed", student };
  }
  public async login({ email, password, FCM }: ILoginDTO, issuer: string) {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new badRequestException("wrong credential");
    }
    const passMatch = await verifyHashService(
      password,
      user.password as string,
    );
    if (!passMatch) {
      throw new badRequestException("wrong credential");
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
    console.log("🚀 ~ AuthService ~ confirmEmail ~ email:", email);
    return await this.email.confirmEmail(email, otp);
  }
  async resendEmail({ email }: resendEmailDTO) {
    return await this.email.resendEmail(email);
  }
}

const authService = new AuthService();
export default authService;
