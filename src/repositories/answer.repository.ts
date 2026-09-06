import { BaseRepository } from "./base.repository";

export class AnswerRepository extends BaseRepository<"Answer"> {
  constructor() {
    super("Answer");
  }

  // Add Answer-specific query methods here.
}

const answerRepository = new AnswerRepository();
export default answerRepository;
