import { BaseRepository } from "./base.repository";

export class AcademicYearRepository extends BaseRepository<"AcademicYear"> {
  constructor() {
    super("AcademicYear");
  }

  // Add AcademicYear-specific query methods here.
}

const academicYearRepository = new AcademicYearRepository();
export default academicYearRepository;
