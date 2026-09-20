import { z } from "zod";

import { QuestionType } from "../../interfaces";

export const createAnswerSchema = z.object({
  text: z.string().trim().min(1, "Answer text is required"),

  isCorrect: z.boolean().default(false),

  order: z.number().int().positive(),
});

export const createQuizQuestionSchema = z.object({
  question: z.string().trim().min(1, "Question is required"),

  type: z.enum(QuestionType),

  points: z.number().int().positive().default(1),

  order: z.number().int().positive(),

  answers: z
    .array(createAnswerSchema)
    .min(1, "Question must have at least one answer"),
});

export const createQuizSchema = {
  body: z.object({
    lessonId: z.uuid(),

    title: z.string().trim().min(1, "Quiz title is required"),

    description: z.string().trim().optional(),

    passingScore: z.number().int().min(0).max(100).optional(),

    timeLimit: z.number().int().positive().optional(),

    questions: z
      .array(createQuizQuestionSchema)
      .min(1, "Quiz must have at least one question"),
  }),
};

export const addQuestion = {
  params: z.object({
    quizId: z.string(),
  }),
  body: z.object({
    questions: z
      .array(createQuizQuestionSchema)
      .min(1, "Quiz must have at least one question"),
  }),
};
export const startQuiz = {
  params: z.object({
    quizId: z.string(),
  }),
};
export const submitQuiz = {
  params: z.object({
    quizId: z.string(),
  }),
  body: z.object({
    attemptId: z.uuid(),
    answers: z.array(
      z.object({
        questionId: z.uuid(),

        // For MCQ / True-False
        answerId: z.uuid().optional(),

        // For written questions
        textAnswer: z.string().optional(),
      }),
    ),
  }),
};
