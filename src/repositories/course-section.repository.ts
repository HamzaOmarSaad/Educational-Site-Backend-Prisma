import { BaseRepository } from "./base.repository";

export class CourseSectionRepository extends BaseRepository<"CourseSection"> {
  constructor() {
    super("CourseSection");
  }

  // Add CourseSection-specific query methods here.
}

const courseSectionRepository = new CourseSectionRepository();
export default courseSectionRepository;
