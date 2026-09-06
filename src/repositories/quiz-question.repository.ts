import { BaseRepository } from "./base.repository";

export class QuizQuestionRepository extends BaseRepository<"QuizQuestion"> {
  constructor() {
    super("QuizQuestion");
  }

  // Add QuizQuestion-specific query methods here.
}

const quizQuestionRepository = new QuizQuestionRepository();
export default quizQuestionRepository;
