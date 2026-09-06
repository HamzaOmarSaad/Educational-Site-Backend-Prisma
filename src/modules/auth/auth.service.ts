import {
  badRequestException,
  conflictException,
  EmailService,
  encryptService,
  hashService,
} from "../../common";
import emailService from "../../common/email";
import redisService, { TokenService } from "../../common/services";
import { emailEnum } from "../../Enums";
import { UserGender, UserRole } from "../../interfaces";
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
import { confirmEmailDTo, ISignupDTO } from "./auth.dto";

export class AuthService {
  private userRepository: UserRepository;
  private studentRepository: StudentProfileRepository;
  private gradeRepository: GradeRepository;
  private trackRepository: TrackRepository;
  private academicYearRepository: AcademicYearRepository;
  //   private redis: typeof redisService;
  //   private tokenService;
  //   private GoogleClient;
  //   private notificationService: NotificationService;
  private email: EmailService;
  constructor() {
    this.studentRepository = studentProfileRepository;
    this.userRepository = userRepository;
    this.gradeRepository = gradeRepository;
    this.trackRepository = trackRepository;
    this.academicYearRepository = academicYearRepository;
    // this.redis = redisService;
    // this.tokenService = new TokenService();
    this.email = emailService;
    // this.notificationService = notificationService;
    // this.GoogleClient = new OAuth2Client(CLIENT_ID);
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
      gender: UserGender.MALE,
      role: UserRole.STUDENT,
      password: hashedPass,
      phone: encryptedPhone,
    });
    if (!user) throw new conflictException("fail");
    const studGrade = await this.gradeRepository.findOne({ name: grade });
    if (!studGrade) throw new conflictException("fail to find grade ");
    const studTrack = await this.trackRepository.findOne({ name: track });
    if (!studTrack) throw new conflictException("fail to find track ");
    const studAcademicYear = await this.academicYearRepository.findOne({
      year: new Date().getFullYear(),
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
    await this.email.sendEmailOTP({
      email,
      subject: emailEnum.confirmEmail,
      title: "email confirmation",
    });

    return { message: " signup done login to proceed", student };
  }
  async login() {}
  async confirmEmail({ email, otp }: confirmEmailDTo) {
    return await this.email.confirmEmail(email, otp);
  }
}

const authService = new AuthService();
export default authService;
