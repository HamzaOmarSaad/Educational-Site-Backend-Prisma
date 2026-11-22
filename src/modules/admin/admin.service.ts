import { CloudinaryService } from "./../../common/services/cloudinary.service";
import {
  badRequestException,
  cloudinaryService,
  conflictException,
  encryptService,
  hashService,
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
import { UploadApiResponse } from "cloudinary";
import { db } from "../../prisma/db";

export class AdminService {
  private userRepository: UserRepository;
  private teacherRepository: TeacherProfileRepository;
  private subjectRepository: SubjectRepository;
  private cloudinary: CloudinaryService;

  constructor() {
    this.userRepository = userRepository;
    this.teacherRepository = teacherProfileRepository;
    this.subjectRepository = subjectRepository;
    this.cloudinary = cloudinaryService;
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
    let profilePic!: UploadApiResponse;
    if (file) {
      profilePic = await this.cloudinary.uploadBuffer({
        buffer: file.buffer,
        folder: `Users/${user.id}/profile`,
      });
      await this.userRepository.update({
        where: { id: user.id },
        update: {
          profilePicture: profilePic.secure_url,
          profilePicturePublic_id: profilePic.public_id,
        },
      });
    }
    const subject = await this.subjectRepository.findById(subjectId);
    if (!subject) throw new conflictException("fail to find subject");

    const teaches = await db.orm.public.Teaches.create({
      teacherId: user.id,
      subjectId: subject.id,
    });
    if (!teaches) throw new conflictException("fail to teaches this subject");

    const teacher = await this.teacherRepository.create({
      bio: bio ?? null,
      experience: experience ?? null,
      qualifications: qualifications ?? null,
      specialization: specialization ?? null,
      userId: user.id,
    });

    if (!teacher) {
      await this.userRepository.deleteById(user.id);
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

    if (data.email) {
      const existing = await this.userRepository.findOne({ email: data.email });
      if (existing && existing.id !== teacher.userId)
        throw new badRequestException("email already exists");
    }

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

    await this.userRepository.updateById(teacher.userId, {
      DeletedAt: new Date(),
      changedCredentialsTime: Date.now(),
    });
    return { message: "teacher deactivated" };
  }

  async getTeachers() {
    const [profiles, teaches, subjects] = await Promise.all([
      this.teacherRepository.model
        .include("user", (user) =>
          user.select("id", "name", "email", "profilePicture", "DeletedAt"),
        )
        .all(),
      (db.orm.public as any).Teaches.all(),
      this.subjectRepository.model.all(),
    ]);
    const subjectById = new Map(
      (subjects as any[]).map((subject) => [subject.id, subject]),
    );
    return (profiles as any[])
      .filter((profile) => profile.user && !profile.user.DeletedAt)
      .map((profile) => {
        const teaching = (teaches as any[]).find(
          (item) => item.teacherId === profile.userId,
        );
        return {
          ...profile,
          subject: teaching
            ? (subjectById.get(teaching.subjectId) ?? null)
            : null,
        };
      });
  }
}

const adminService = new AdminService();
export default adminService;
