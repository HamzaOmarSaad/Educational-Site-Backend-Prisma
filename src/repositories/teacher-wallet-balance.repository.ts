import { BaseRepository } from "./base.repository";

export class TeacherWalletBalanceRepository extends BaseRepository<"TeacherWalletBalance"> {
  constructor() {
    super("TeacherWalletBalance");
  }

  // Add TeacherWalletBalance-specific query methods here.
}

const teacherWalletBalanceRepository = new TeacherWalletBalanceRepository();
export default teacherWalletBalanceRepository;
