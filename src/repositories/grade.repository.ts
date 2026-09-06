import { BaseRepository } from "./base.repository";

export class GradeRepository extends BaseRepository<"Grade"> {
  constructor() {
    super("Grade");
  }

  // Add Grade-specific query methods here.
}

const gradeRepository = new GradeRepository();
export default gradeRepository;
