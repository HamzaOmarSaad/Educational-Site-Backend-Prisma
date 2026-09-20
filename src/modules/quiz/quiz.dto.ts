import z from "zod";
import {
  addQuestion,
  createQuizSchema,
  startQuiz,
  submitQuiz,
} from "./quiz.validation";

export type CreateQuizDTO = z.infer<typeof createQuizSchema.body>;

export type addQuestionParamsDto = z.infer<typeof addQuestion.params>;
export type addQuestionBodyDto = z.infer<typeof addQuestion.body>;

export type startQuizParamsDTO = z.infer<typeof startQuiz.params>;
export type startQuizDTO = z.infer<typeof startQuiz.params>;

export type SubmitQuizDTO = z.infer<typeof submitQuiz.body>;
