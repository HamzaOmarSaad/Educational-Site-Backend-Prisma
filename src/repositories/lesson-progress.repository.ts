import { BaseRepository } from "./base.repository";

export class LessonProgressRepository extends BaseRepository<"LessonProgress"> {
  constructor() {
    super("LessonProgress");
  }

  // Add LessonProgress-specific query methods here.
}

const lessonProgressRepository = new LessonProgressRepository();
export default lessonProgressRepository;
