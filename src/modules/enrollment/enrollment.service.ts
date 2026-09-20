import { badRequestException } from "../../common";
import { db } from "../../prisma/db";
import {
  courseRepository,
  CourseRepository,
  SubscriptionRepository,
  subscriptionRepository,
  TeacherWalletBalanceRepository,
  teacherWalletBalanceRepository,
  walletRepository,
  WalletRepository,
} from "../../repositories";
import { enrollCourseDTO } from "./enrollment.dto";

export class EnrollmentService {
  private courseRepository: CourseRepository;
  private teacherWalletRepository: TeacherWalletBalanceRepository;
  private walletRepository: WalletRepository;
  private subscriptionRepository: SubscriptionRepository;

  constructor() {
    this.teacherWalletRepository = teacherWalletBalanceRepository;
    this.walletRepository = walletRepository;
    this.courseRepository = courseRepository;
    this.subscriptionRepository = subscriptionRepository;
  }

  async enrollCourse({ courseId }: enrollCourseDTO, studentId: string) {
    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new badRequestException("no course");
    const isSubscribed = await this.subscriptionRepository.findOne({
      studentId,
      teacherId: course.teacherId,
      status: "APPROVED",
    });
    if (!isSubscribed)
      throw new badRequestException(
        "student is not subscribed or unapproved yet",
      );
    const wallet = await this.walletRepository.findOne({ studentId });
    if (!wallet) throw new badRequestException("no course");

    const teacherWallet = await this.teacherWalletRepository.findOne({
      walletId: wallet.id,
      teacherId: course.teacherId,
    });
    if (!teacherWallet)
      throw new badRequestException("no wallet for this teacher");

    const coursePrice = Number(course.price);
    if (Number(teacherWallet?.balance) < coursePrice) {
      throw new badRequestException("insufficient balance");
    }
    const balanceAfter = Number(teacherWallet?.balance) - coursePrice;
    // update balance -price
    await this.teacherWalletRepository.update({
      where: { walletId: wallet.id, teacherId: course.teacherId },
      update: {
        balance: balanceAfter,
      },
    });

    const result = await db.transaction(async (tx) => {
      // record transaction
      const transaction = await tx.orm.public.WalletTransaction.create({
        amount: course.price,
        balanceAfter: balanceAfter.toString(),
        balanceBefore: teacherWallet?.balance,
        type: "COURSE_PURCHASE",
      });
      // make an enrollment
      const enrollment = await tx.orm.public.Enrollment.create({
        courseId: course.id,
        studentId,
      });

      return { transaction, enrollment };
    });
    return result;
  }
}
const enrollmentService = new EnrollmentService();
export default enrollmentService;
