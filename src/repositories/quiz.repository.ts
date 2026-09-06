import { BaseRepository } from "./base.repository";

export class QuizRepository extends BaseRepository<"Quiz"> {
  constructor() {
    super("Quiz");
  }

  // Add Quiz-specific query methods here.
}

const quizRepository = new QuizRepository();
export default quizRepository;
