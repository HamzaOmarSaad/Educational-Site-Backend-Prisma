import lessonProgressRepository, {
  LessonProgressRepository,
} from "./../../repositories/lesson-progress.repository";
import enrollmentRepository, {
  EnrollmentRepository,
} from "./../../repositories/enrollment.repository";
import {
  badRequestException,
  cloudinaryService,
  CloudinaryService,
  conflictException,
  NotFoundException,
  S3Service,
  s3Service,
} from "../../common";
import { ContentType } from "../../interfaces";
import {
  courseSectionRepository,
  CourseSectionRepository,
  lessonAttachmentRepository,
  LessonAttachmentRepository,
  lessonRepository,
  LessonRepository,
  LessonVideoRepository,
  lessonVideoRepository,
} from "../../repositories";
import { createLessonAttachmentDTO, createLessonVideoDTO } from "./lesson.dto";

export class LessonService {
  private courseSectionRepository: CourseSectionRepository;
  private lessonRepository: LessonRepository;
  private lessonVideoRepository: LessonVideoRepository;
  private lessonAttachmentRepository: LessonAttachmentRepository;
  private enrollmentRepository: EnrollmentRepository;
  private lessonProgressRepository: LessonProgressRepository;

  private s3: S3Service;
  private cloudinary: CloudinaryService;

  constructor() {
    this.lessonRepository = lessonRepository;
    this.lessonVideoRepository = lessonVideoRepository;
    this.courseSectionRepository = courseSectionRepository;
    this.lessonAttachmentRepository = lessonAttachmentRepository;
    this.enrollmentRepository = enrollmentRepository;
    this.lessonProgressRepository = lessonProgressRepository;
    this.s3 = s3Service;
    this.cloudinary = cloudinaryService;
  }
  async createLessonVideo({
    sectionId,
    title,
    description,
    content,
    order,
    isFree = false,
    provider,
    file,
    duration,
  }: createLessonVideoDTO) {
    // Check section exists
    const section = await this.courseSectionRepository.findById(sectionId);

    if (!section) {
      throw new NotFoundException("Course section not found");
    }

    const lesson = await this.lessonRepository.create({
      sectionId,
      title,
      description: description ?? null,
      content: content ?? null,
      order,
      isFree: isFree ?? false,
    });
    if (!lesson) throw new badRequestException("fail");

    const existingVideo = await this.lessonVideoRepository.findById(lesson.id);

    if (existingVideo) {
      throw new conflictException("This lesson already has a video");
    }
    let url!: string;
    if (file) {
      const uploadedFile = await this.cloudinary.uploadVideo({
        filePath: file.path,
        folder: `lesson/${lesson.id}/video`,
      });
      url = uploadedFile.url;
    }
    const video = await this.lessonVideoRepository.create({
      lessonId: lesson.id,
      url,
      duration: duration ?? null,
      provider: provider ?? null,
    });

    return video;
  }
  async createLessonAttachment({
    sectionId,
    title,
    description,
    content,
    order,
    isFree = false,
    file,
  }: createLessonAttachmentDTO) {
    const section = await this.courseSectionRepository.findById(sectionId);

    if (!section) {
      throw new NotFoundException("Course section not found");
    }

    const lesson = await this.lessonRepository.create({
      sectionId,
      title,
      description: description ?? null,
      content: content ?? null,
      order,
      isFree: isFree ?? false,
    });
    if (!lesson) throw new badRequestException("fail");

    const uploadedFile = await this.s3.uploadAsset({
      file,
      path: `Lessons/${lesson.id}/attachments`,
    });

    return this.lessonAttachmentRepository.create({
      lessonId: lesson.id,
      name: file.originalname,
      url: uploadedFile,
      type: file.mimetype == "pdf" ? ContentType.PDF : ContentType.OTHER,
      size: file.size,
    });
  }
  async updateLessonProgress({
    courseId,
    lessonId,
    studentId,
    progress,
    watchedSeconds,
  }: {
    courseId: string;
    lessonId: string;
    studentId: string;
    progress: number;
    watchedSeconds: number;
  }) {
    // -----------------------------------------
    // 1. Validate progress
    // -----------------------------------------

    if (progress < 0 || progress > 100) {
      throw new badRequestException("Progress must be between 0 and 100");
    }

    if (watchedSeconds < 0) {
      throw new badRequestException("Watched seconds cannot be negative");
    }

    // -----------------------------------------
    // 2. Check enrollment
    // -----------------------------------------

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

    // -----------------------------------------
    // 3. Check lesson
    // -----------------------------------------

    const lesson = await this.lessonRepository.model
      .where({
        id: lessonId,
      })
      .include("section")
      .first();

    if (!lesson) {
      throw new badRequestException("Lesson not found");
    }

    if (lesson.section.courseId !== courseId) {
      throw new badRequestException("Lesson does not belong to this course");
    }

    // -----------------------------------------
    // 4. Get existing progress
    // -----------------------------------------

    const existingProgress = await this.lessonProgressRepository.model
      .where({
        studentId,
        lessonId,
      })
      .first();

    // -----------------------------------------
    // 5. Don't allow progress to decrease
    // -----------------------------------------

    const finalProgress = Math.max(existingProgress?.progress ?? 0, progress);

    const finalWatchedSeconds = Math.max(
      existingProgress?.watchedSeconds ?? 0,
      watchedSeconds,
    );

    // -----------------------------------------
    // 6. Determine status
    // -----------------------------------------

    const completed = finalProgress >= 90;

    const status = completed
      ? "COMPLETED"
      : finalProgress > 0
        ? "IN_PROGRESS"
        : "NOT_STARTED";

    // -----------------------------------------
    // 7. Create or update
    // -----------------------------------------

    let lessonProgress;

    if (existingProgress) {
      lessonProgress = await this.lessonProgressRepository.update({
        where: {
          id: existingProgress.id,
        },

        update: {
          progress: finalProgress,
          watchedSeconds: finalWatchedSeconds,
          status,
          completedAt: completed
            ? (existingProgress.completedAt ?? new Date().toISOString())
            : null,

          updatedAt: new Date().toISOString(),
        },
      });
    } else {
      lessonProgress = await this.lessonProgressRepository.model.create({
        studentId,
        lessonId,
        progress: finalProgress,
        watchedSeconds: finalWatchedSeconds,
        status,

        completedAt: completed ? new Date().toISOString() : null,
      });
    }

    // -----------------------------------------
    // 8. Calculate course progress
    // -----------------------------------------

    const sections = await this.courseSectionRepository.model
      .where({
        courseId,
      })
      .all();

    let totalLessons = 0;
    let completedLessons = 0;

    for (const section of sections) {
      const lessons = await this.lessonRepository.model
        .where({
          sectionId: section.id,
        })
        .all();

      totalLessons += lessons.length;

      for (const lesson of lessons) {
        const lessonProgress = await this.lessonProgressRepository.model
          .where({
            studentId,
            lessonId: lesson.id,
            status: "COMPLETED",
          })
          .first();

        if (lessonProgress) {
          completedLessons++;
        }
      }
    }

    const percentage =
      totalLessons === 0
        ? 0
        : Math.round((completedLessons / totalLessons) * 100);

    // -----------------------------------------
    // 9. Complete enrollment
    // -----------------------------------------

    const courseCompleted =
      totalLessons > 0 && completedLessons === totalLessons;

    if (courseCompleted) {
      await this.enrollmentRepository.update({
        where: {
          id: enrollment.id,
        },

        update: {
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
        },
      });
    }

    return {
      lessonProgress,

      courseProgress: {
        totalLessons,
        completedLessons,
        percentage,
        completed: courseCompleted,
      },
    };
  }
}
const lessonService = new LessonService();
export default lessonService;
