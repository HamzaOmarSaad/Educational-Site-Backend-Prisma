import { BaseRepository } from "./base.repository";

export class StudentProfileRepository extends BaseRepository<"StudentProfile"> {
  constructor() {
    super("StudentProfile");
  }

  // Add StudentProfile-specific query methods here.
}

const studentProfileRepository = new StudentProfileRepository();
export default studentProfileRepository;
