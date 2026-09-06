import { BaseRepository } from "./base.repository";

export class QuizAttemptRepository extends BaseRepository<"QuizAttempt"> {
  constructor() {
    super("QuizAttempt");
  }

  // Add QuizAttempt-specific query methods here.
}

const quizAttemptRepository = new QuizAttemptRepository();
export default quizAttemptRepository;
