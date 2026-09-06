import { BaseRepository } from "./base.repository";

export class TeacherProfileRepository extends BaseRepository<"TeacherProfile"> {
  constructor() {
    super("TeacherProfile");
  }

  // Add TeacherProfile-specific query methods here.
}

const teacherProfileRepository = new TeacherProfileRepository();
export default teacherProfileRepository;
