import { BaseRepository } from "./base.repository";

export class CourseRepository extends BaseRepository<"Course"> {
  constructor() {
    super("Course");
  }

  // Add Course-specific query methods here.
}

const courseRepository = new CourseRepository();
export default courseRepository;
