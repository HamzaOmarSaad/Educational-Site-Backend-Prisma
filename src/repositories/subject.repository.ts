import { BaseRepository } from "./base.repository";

export class SubjectRepository extends BaseRepository<"Subject"> {
  constructor() {
    super("Subject");
  }

  // Add Subject-specific query methods here.
}

const subjectRepository = new SubjectRepository();
export default subjectRepository;
