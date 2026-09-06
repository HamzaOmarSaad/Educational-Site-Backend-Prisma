import { BaseRepository } from "./base.repository";

export class LessonVideoRepository extends BaseRepository<"LessonVideo"> {
  constructor() {
    super("LessonVideo");
  }

  // Add LessonVideo-specific query methods here.
}

const lessonVideoRepository = new LessonVideoRepository();
export default lessonVideoRepository;
