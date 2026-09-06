import { BaseRepository } from "./base.repository";

export class EnrollmentRepository extends BaseRepository<"Enrollment"> {
  constructor() {
    super("Enrollment");
  }

  // Add Enrollment-specific query methods here.
}

const enrollmentRepository = new EnrollmentRepository();
export default enrollmentRepository;
