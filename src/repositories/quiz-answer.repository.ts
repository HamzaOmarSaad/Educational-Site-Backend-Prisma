import { BaseRepository } from "./base.repository";

export class QuizAnswerRepository extends BaseRepository<"QuizAnswer"> {
  constructor() {
    super("QuizAnswer");
  }

  // Add QuizAnswer-specific query methods here.
}

const quizAnswerRepository = new QuizAnswerRepository();
export default quizAnswerRepository;
