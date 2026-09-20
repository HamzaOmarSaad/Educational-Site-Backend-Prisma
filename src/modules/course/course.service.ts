import {
  badRequestException,
  NotFoundException,
  s3Service,
  S3Service,
} from "../../common";
import { UserRole } from "../../interfaces";
import {
  courseRepository,
  CourseRepository,
  courseSectionRepository,
  CourseSectionRepository,
  enrollmentRepository,
  EnrollmentRepository,
  gradeRepository,
  GradeRepository,
  lessonRepository,
  LessonRepository,
  subjectRepository,
  SubjectRepository,
  userRepository,
  UserRepository,
} from "../../repositories";
import { createCourseDTO, createCourseSectionDTO } from "./course.dto";

export class CourseService {
  private userRepository: UserRepository;
  private gradeRepository: GradeRepository;
  private courseRepository: CourseRepository;
  private courseSectionRepository: CourseSectionRepository;
  private subjectRepository: SubjectRepository;
  private s3: S3Service;
  private enrollmentRepository: EnrollmentRepository;
  private lessonRepository: LessonRepository;

  constructor() {
    this.userRepository = userRepository;
    this.subjectRepository = subjectRepository;
    this.courseSectionRepository = courseSectionRepository;
    this.courseRepository = courseRepository;
    this.gradeRepository = gradeRepository;
    this.lessonRepository = lessonRepository;
    this.enrollmentRepository = enrollmentRepository;

    this.s3 = s3Service;
  }
  async createCourse({
    teacherId,
    gradeId,
    subjectId,
    title,
    description,
    price,
    file,
  }: createCourseDTO) {
    // 1. Check teacher exists
    const teacher = await this.userRepository.findOne({
      id: teacherId,
      role: UserRole.TEACHER,
    });

    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }

    // 2. Check grade exists
    const grade = await this.gradeRepository.findById(gradeId);

    if (!grade) {
      throw new NotFoundException("Grade not found");
    }

    // 3. Check subject exists
    const subject = await this.subjectRepository.findById(subjectId);

    if (!subject) {
      throw new NotFoundException("Subject not found");
    }

    // 4. Create course
    const course = await this.courseRepository.create({
      teacherId,
      gradeId,
      subjectId,
      title,
      description: description ?? null,
      price,
    });
    if (!course) throw new badRequestException("cannot create course ");

    let thumbnailUrl: string | null = null;
    if (file) {
      thumbnailUrl = await this.s3.uploadAsset({
        file: file,
        path: `Course/${course.id}/thumbnail`,
      });
    }

    const updated = await this.courseRepository.updateById(course.id, {
      thumbnailUrl,
    });

    return updated ?? course;
  }
  async createSection({
    courseId,
    title,
    description,
    order,
  }: createCourseSectionDTO) {
    // Check that course exists
    const course = await this.courseRepository.findById(courseId);

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    const section = await this.courseSectionRepository.create({
      courseId,
      title,
      description: description ?? null,
      order,
    });

    return section;
  }
  async getCourse(teacherId: string, studentId: string) {
    const stud = await this.userRepository.model
      .where({ id: studentId })
      .include("studentProfile")
      .first();
    if (!stud) throw new badRequestException("no student");
    const courses = await this.courseRepository.findMany({
      teacherId,
      gradeId: stud.studentProfile?.gradeId,
    });

    return courses;
  }
  async watchCourse(courseId: string, studentId: string) {
    const enrollment = await this.enrollmentRepository.model
      .where({
        studentId,
        courseId,
        status: "ACTIVE",
      })
      .first();

    if (!enrollment) {
      throw new badRequestException("You are not enrolled in this course");
    }

    // 2. Get course
    const course = await this.courseRepository.model
      .where({
        id: courseId,
      })
      .include("sections")
      .first();

    if (!course) {
      throw new badRequestException("Course not found");
    }

    // 3. Get sections
    const sections = await this.courseSectionRepository.model
      .where({
        courseId,
      })
      .include("lessons")
      .all();

    // 4. Get lessons + video + attachments + progress
    const sectionsWithContent = await Promise.all(
      sections.map(async (section) => {
        const lessons = await this.lessonRepository.model
          .where({
            sectionId: section.id,
          })
          .include("video")
          .include("attachments")
          .include("progress")
          .all();

        // Only return this student's progress
        const lessonsWithProgress = lessons.map((lesson: any) => {
          const studentProgress = lesson.progress?.find(
            (progress: any) => progress.studentId === studentId,
          );

          return {
            ...lesson,
            progress: studentProgress ?? null,
          };
        });

        return {
          ...section,
          lessons: lessonsWithProgress,
        };
      }),
    );

    // 5. Calculate course progress
    const allLessons = sectionsWithContent.flatMap(
      (section: any) => section.lessons,
    );

    const totalLessons = allLessons.length;

    const completedLessons = allLessons.filter(
      (lesson: any) => lesson.progress?.status === "COMPLETED",
    ).length;

    const percentage =
      totalLessons === 0
        ? 0
        : Math.round((completedLessons / totalLessons) * 100);

    return {
      ...course,
      sections: sectionsWithContent,

      progress: {
        totalLessons,
        completedLessons,
        percentage,
      },
    };
  }
}
const courseService = new CourseService();
export default courseService;
