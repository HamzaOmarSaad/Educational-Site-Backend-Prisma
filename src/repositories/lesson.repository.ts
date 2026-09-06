import { BaseRepository } from "./base.repository";

export class LessonRepository extends BaseRepository<"Lesson"> {
  constructor() {
    super("Lesson");
  }

  // Add Lesson-specific query methods here.
}

const lessonRepository = new LessonRepository();
export default lessonRepository;
