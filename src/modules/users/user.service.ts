import {
  badRequestException,
  s3Service,
  S3Service,
  encryptService,
} from "../../common";
import { UserRole } from "../../interfaces";
import {
  subscriptionRepository,
  studentProfileRepository as spRepository,
  SubscriptionRepository,
  teacherProfileRepository,
  TeacherProfileRepository,
  userRepository,
  UserRepository,
  walletRepository,
  WalletRepository,
} from "../../repositories";
import teacherWalletBalanceRepository, {
  TeacherWalletBalanceRepository,
} from "./../../repositories/teacher-wallet-balance.repository";

export class UserService {
  private userRepository: UserRepository;
  private teacherRepository: TeacherProfileRepository;
  private subscriptionRepository: SubscriptionRepository;
  private walletRepository: WalletRepository;
  private TeacherWalletRepository: TeacherWalletBalanceRepository;
  private s3: S3Service;

  constructor() {
    this.userRepository = userRepository;
    this.teacherRepository = teacherProfileRepository;
    this.subscriptionRepository = subscriptionRepository;
    this.walletRepository = walletRepository;
    this.TeacherWalletRepository = teacherWalletBalanceRepository;
    this.s3 = s3Service;
  }

  async getProfile(userId: string) {
    const stud = await this.userRepository.model
      .where({ id: userId })
      .select("id", "email", "name", "gender", "profilePicture")
      .first();
    return stud;
  }
  async getStudentProfile(userId: string) {
    const stud = await this.userRepository.findOneJoined(
      { id: userId, role: UserRole.STUDENT },
      "studentProfile",
    );
    return stud;
  }

  async updateStudentProfile(userId: string, data: any) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new badRequestException("user not found");

    const userUpdates: any = {};
    if (data.name) userUpdates.name = data.name;
    if (data.email) userUpdates.email = data.email;
    if (data.phone) userUpdates.phone = encryptService(data.phone as string);

    if (Object.keys(userUpdates).length) {
      await this.userRepository.updateById(userId, userUpdates);
    }

    // update student profile fields (everything else)
    const studentProfileFields = { ...data } as any;
    delete studentProfileFields.name;
    delete studentProfileFields.email;
    delete studentProfileFields.phone;

    if (Object.keys(studentProfileFields).length) {
      const existing = await spRepository.findOne({ userId });
      if (existing) {
        await spRepository.updateById(existing.id, studentProfileFields);
      } else {
        await spRepository.create({ ...studentProfileFields, userId });
      }
    }

    return this.getStudentProfile(userId);
  }

  async deleteStudentProfile(userId: string) {
    const existing = await spRepository.findOne({ userId });
    if (!existing) throw new badRequestException("student profile not found");
    await spRepository.deleteById(existing.id);
    return { message: "student profile deleted" };
  }

  async UploadProfilePicture(file: Express.Multer.File, userid: string) {
    const user = await this.userRepository.findById(userid);
    if (!user) throw new badRequestException("user not found ");
    const oldPic = user.profilePicture;
    const newProfilePicture = await this.s3.uploadAsset({
      file,
      path: `Users/${user.id.toString()}/profile`,
    });

    if (oldPic) {
      await this.s3.deleteAsset({ Key: oldPic as string });
    }
    const update = await this.userRepository.updateById(userid, {
      profilePicture: newProfilePicture,
    });
    // this.redis.clearCache("/user", user._id.toString());
    if (!update) throw new badRequestException("update failed ");
    return user;
  }
  async getTeachersAll(subjectId?: string, userId?: string) {
    const teachers = await this.teacherRepository.model
      .where({
        ...(subjectId ? { subjectId } : {}),
        ...(userId ? { userId } : {}),
      })
      .include("user", (user) => user.select("name", "profilePicture", "id"))
      .include("subject")
      .select("id", "bio", "experience", "qualifications")
      .all();
    return teachers;
  }
  async getTeacherDetails(userId: string) {
    const teacher = await this.teacherRepository.model
      .where({ userId })
      .include("user", (user) =>
        user.select("name", "profilePicture", "id", "phone"),
      )
      .select("id", "bio", "experience", "qualifications")
      .first();

    if (!teacher) {
      throw new badRequestException("Teacher not found");
    }

    return teacher;
  }
  async getSubscribedTeachers(userId: string) {
    const teachers = await this.subscriptionRepository.findMany({
      studentId: userId,
    });

    return teachers;
  }
  async subscribeWithTeacher(userId: string, teacherId: string) {
    const sub = await this.subscriptionRepository.create({
      studentId: userId,
      teacherId,
    });
    const wallet = await this.walletRepository.findOne({ studentId: userId });
    if (!wallet) throw new badRequestException("wallet not found ");

    // put this in approve student service
    const teacherWallet = await this.TeacherWalletRepository.create({
      teacherId,
      walletId: wallet.id,
    });
    if (!teacherWallet) throw new badRequestException("failed to create");
    return sub;
  }
}

const userService = new UserService();
export default userService;
