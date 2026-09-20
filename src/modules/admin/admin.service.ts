import {
  badRequestException,
  conflictException,
  encryptService,
  hashService,
  s3Service,
  S3Service,
} from "../../common";
import { UserRole } from "../../interfaces";
import {
  SubjectRepository,
  subjectRepository,
  teacherProfileRepository,
  TeacherProfileRepository,
  userRepository,
  UserRepository,
} from "../../repositories";
import { createTeacherDTO } from "./admin.dto";

export class AdminService {
  private userRepository: UserRepository;
  private teacherRepository: TeacherProfileRepository;
  private subjectRepository: SubjectRepository;
  private s3: S3Service;

  constructor() {
    this.userRepository = userRepository;
    this.teacherRepository = teacherProfileRepository;
    this.subjectRepository = subjectRepository;
    this.s3 = s3Service;
  }
  async createTeacher({
    name,
    password,
    email,
    phone,
    gender,
    subjectId,
    bio,
    specialization,
    experience,
    qualifications,
    file,
  }: createTeacherDTO) {
    const isEmail = await this.userRepository.findOne({ email });
    if (isEmail) {
      throw new badRequestException("email already exist");
    }
    const hashedPass = await hashService(password);
    const encryptedPhone = encryptService(phone as string);

    const user = await this.userRepository.create({
      name,
      email,
      gender,
      role: UserRole.TEACHER,
      password: hashedPass,
      phone: encryptedPhone,
    });
    if (!user) throw new conflictException("fail");
    let profilePic!: string;
    if (file) {
      profilePic = await this.s3.uploadAsset({
        file: file as Express.Multer.File,
        path: `Users/${user.id}/profile`,
      });

      await this.userRepository.update({
        where: { id: user.id },
        update: {
          profilePicture: profilePic,
        },
      });
    }
    const subject = await this.subjectRepository.findById(subjectId);
    if (!subject) throw new conflictException("fail to find subject");

    const teacher = await this.teacherRepository.create({
      subjectId,
      bio: bio ?? null,
      experience: experience ?? null,
      qualifications: qualifications ?? null,
      specialization: specialization ?? null,
      userId: user.id,
    });

    if (!teacher) {
      await this.userRepository.deleteById(user.id);
      await this.s3.deleteAsset({ Key: profilePic });
      throw new badRequestException("failed to create your account ");
    }

    return { message: " signup done login to proceed", teacher };
  }
  async createAdmin({
    name,
    password,
    email,
    phone,
    gender,
  }: createTeacherDTO) {
    const isEmail = await this.userRepository.findOne({ email });
    if (isEmail) {
      throw new badRequestException("email already exist");
    }
    const hashedPass = await hashService(password);
    const encryptedPhone = encryptService(phone as string);

    const user = await this.userRepository.create({
      name,
      email,
      gender,
      role: UserRole.ADMIN,
      password: hashedPass,
      phone: encryptedPhone,
    });
    if (!user) throw new conflictException("fail");

    return { message: " signup done login to proceed", user };
  }
  async updateTeacher(teacherId: string, data: any) {
    const teacher = await this.teacherRepository.findById(teacherId);
    if (!teacher) throw new badRequestException("teacher not found");

    const userFields: any = {};
    if (data.name) userFields.name = data.name;
    if (data.email) userFields.email = data.email;
    if (data.phone) userFields.phone = encryptService(data.phone as string);

    const teacherFields = { ...data } as any;
    delete teacherFields.name;
    delete teacherFields.email;
    delete teacherFields.phone;

    if (Object.keys(teacherFields).length) {
      await this.teacherRepository.updateById(teacherId, teacherFields);
    }

    if (Object.keys(userFields).length) {
      await this.userRepository.updateById(teacher.userId, userFields);
    }

    return { message: "teacher updated" };
  }

  async deleteTeacher(teacherId: string) {
    const teacher = await this.teacherRepository.findById(teacherId);
    if (!teacher) throw new badRequestException("teacher not found");

    // remove teacher profile
    await this.teacherRepository.deleteById(teacherId);

    // remove user and their profile picture if present
    const user = await this.userRepository.findById(teacher.userId);
    if (user && (user as any).profilePicture) {
      await this.s3.deleteAsset({ Key: (user as any).profilePicture });
    }
    await this.userRepository.deleteById(teacher.userId);

    return { message: "teacher deleted" };
  }
}

const adminService = new AdminService();
export default adminService;
