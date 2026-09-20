import {
  subscriptionRepository,
  SubscriptionRepository,
} from "./../../repositories";

export class TeacherService {
  private subscriptionRepository: SubscriptionRepository;

  constructor() {
    this.subscriptionRepository = subscriptionRepository;
  }
  getSubscribedStudents(teacherId: string) {
    const students = this.subscriptionRepository.model
      .where({ teacherId, status: "APPROVED" })
      .include("student")
      .all();
    return students;
  }
  getStudentsRequests(teacherId: string) {
    const students = this.subscriptionRepository.model
      .where({ teacherId, status: "PENDING" })
      .include("student")
      .all();
    return students;
  }
  approveStudent(teacherId: string, studentId: string) {
    const student = this.subscriptionRepository.update({
      where: { teacherId, studentId, status: "PENDING" },
      update: { status: "APPROVED" },
    });
    return student;
  }
}

const teacherService = new TeacherService();
export default teacherService;
