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
  teacherProfileRepository,
  userRepository,
  UserRepository,
} from "../../repositories";
import { createCourseDTO, createCourseSectionDTO } from "./course.dto";
import { db } from "../../prisma/db";

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
        file: file as Express.Multer.File,
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
  async getTeacherCourse(teacherId: string, studentId: string) {
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
  async getMyCourse(studentId: string) {
    const enrollment = await this.enrollmentRepository.model
      .where({
        studentId,
        status: "ACTIVE",
      })
      .include("course")
      .all();

    if (!enrollment) {
      throw new badRequestException("You are not enrolled in this course");
    }
    return enrollment;
  }
  async getAllCourse() {
    const courses = await this.courseRepository.model.all();
    if (!courses) {
      throw new badRequestException("You are not enrolled in this course");
    }
    return courses;
  }
  async getSubjects(year?: number) {
    const currentYear = new Date().getMonth() >= 8
      ? new Date().getFullYear() + 1
      : new Date().getFullYear();
    const catalogYear = year ?? currentYear;
    const [subjects, tracks, academicYears, grades, courses] = await Promise.all([
      this.subjectRepository.model.all(),
      (db.orm.public as any).Track.all(),
      (db.orm.public as any).AcademicYear.all(),
      (db.orm.public as any).Grade.all(),
      this.courseRepository.model.all(),
    ]);
    const trackById = new Map(tracks.map((track: any) => [track.id, track]));
    const yearById = new Map(academicYears.map((academicYear: any) => [academicYear.id, academicYear]));
    const gradeById = new Map(grades.map((grade: any) => [grade.id, grade]));
    const courseCounts = new Map<string, number>();
    for (const course of courses as any[]) {
      courseCounts.set(course.subjectId, (courseCounts.get(course.subjectId) ?? 0) + 1);
    }
    return (subjects as any[]).flatMap((subject) => {
      const track = trackById.get(subject.trackId) as any;
      const academicYear = track && yearById.get(track.academicYearId) as any;
      if (!track || !academicYear || academicYear.year !== catalogYear) return [];
      return [{
        ...subject,
        track: { ...track, academicYear: { ...academicYear, grade: gradeById.get(academicYear.gradeId) ?? null } },
        courseCount: courseCounts.get(subject.id) ?? 0,
      }];
    });
  }
  async getTeacherWorkspaceOptions(teacherId: string) {
    const [subjects, courses, allGrades, allSections, allLessons, teacherProfile] = await Promise.all([
      this.getSubjects(),
      this.courseRepository.findMany({ teacherId }),
      this.gradeRepository.findAll(),
      this.courseSectionRepository.findAll(),
      this.lessonRepository.findAll(),
      teacherProfileRepository.findOne({ userId: teacherId }),
    ]);
    const courseIds = new Set((courses as any[]).map((course) => course.id));
    const sections = (allSections as any[]).filter((section) => courseIds.has(section.courseId));
    const sectionIds = new Set(sections.map((section: any) => section.id));
    const lessons = (allLessons as any[]).filter((lesson) => sectionIds.has(lesson.sectionId));
    const gradeIds = new Set((subjects as any[]).map((subject) => subject.track?.academicYear?.grade?.id).filter(Boolean));
    const grades = (allGrades as any[]).filter((grade) => gradeIds.has(grade.id));
    return { teacherProfileId: teacherProfile?.id ?? null, grades, subjects, courses, sections, lessons };
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
          .include("quizzes")
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
