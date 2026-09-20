import quizAnswerRepository, {
  QuizAnswerRepository,
} from "./../../repositories/quiz-answer.repository";
import { badRequestException } from "../../common";
import {
  answerRepository,
  AnswerRepository,
  LessonRepository,
  lessonRepository,
  QuizAttemptRepository,
  quizAttemptRepository,
  quizQuestionRepository,
  QuizQuestionRepository,
} from "../../repositories";
import quizRepository, {
  QuizRepository,
} from "./../../repositories/quiz.repository";
import {
  addQuestionBodyDto,
  addQuestionParamsDto,
  CreateQuizDTO,
  startQuizParamsDTO,
  SubmitQuizDTO,
} from "./quiz.dto";

export class QuizService {
  private quizRepository: QuizRepository;
  private quizQuestionRepository: QuizQuestionRepository;
  private answerRepository: AnswerRepository;
  private lessonRepository: LessonRepository;
  private quizAttemptRepository: QuizAttemptRepository;
  private quizAnswerRepository: QuizAnswerRepository;

  constructor() {
    this.quizRepository = quizRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.answerRepository = answerRepository;
    this.lessonRepository = lessonRepository;
    this.quizAttemptRepository = quizAttemptRepository;
    this.quizAnswerRepository = quizAnswerRepository;
  }

  async createQuiz({
    lessonId,
    questions,
    description,
    title,
    passingScore,
    timeLimit,
  }: CreateQuizDTO) {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) throw new badRequestException("lesson not found");

    const quiz = await this.quizRepository.create({
      lessonId: lessonId,
      title: title,
      description: description ?? null,
      passingScore: passingScore ?? 100,
      timeLimit: timeLimit ?? null,
    });

    for (const question of questions) {
      const createdQuestion = await this.quizQuestionRepository.create({
        quizId: quiz.id,
        question: question.question,
        type: question.type,
        points: question.points,
        order: question.order,
      });

      for (const answer of question.answers) {
        await this.answerRepository.create({
          questionId: createdQuestion.id,
          text: answer.text,
          isCorrect: answer.isCorrect,
          order: answer.order,
        });
      }
    }

    return quiz;
  }
  async addQuestions(
    { quizId }: addQuestionParamsDto,
    { questions }: addQuestionBodyDto,
  ) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new badRequestException("fail");

    for (const question of questions) {
      const createdQuestion = await this.quizQuestionRepository.create({
        quizId: quiz.id,
        question: question.question,
        type: question.type,
        points: question.points,
        order: question.order,
      });

      for (const answer of question.answers) {
        await this.answerRepository.create({
          questionId: createdQuestion.id,
          text: answer.text,
          isCorrect: answer.isCorrect,
          order: answer.order,
        });
      }
    }
  }
  async getQuiz(quizId: string, lessonId?: string) {
    const quiz = await this.quizRepository.findOne({
      id: quizId,
      ...(lessonId ? { lessonId } : {}),
    });

    if (!quiz) {
      throw new badRequestException("No quiz found");
    }

    const questionsWithAnswers = await this.quizQuestionRepository.model
      .where({ quizId })
      .include("answers", (answer) =>
        answer.select("id", "order", "text").orderBy((a) => a.order.asc()),
      )
      .all();

    return {
      ...quiz,
      questions: questionsWithAnswers,
    };
  }
  async startQuiz({ quizId }: startQuizParamsDTO, studentId: string) {
    const quiz = await this.quizRepository.findById(quizId);

    if (!quiz) {
      throw new badRequestException("Quiz not found");
    }

    // Check quiz has questions
    const questions = await this.quizQuestionRepository.findMany({
      quizId,
    });

    if (!questions.length) {
      throw new badRequestException("Quiz has no questions");
    }

    // Check existing unfinished attempt
    const existingAttempt = await this.quizAttemptRepository.findOne({
      studentId,
      quizId,
      completedAt: null,
    });

    if (existingAttempt) {
      return existingAttempt;
    }

    return this.quizAttemptRepository.create({
      studentId,
      quizId,
    });
  }
  async submitQuiz(studentId: string, { answers, attemptId }: SubmitQuizDTO) {
    const attempt = await this.quizAttemptRepository.findById(attemptId);

    if (!attempt) {
      throw new badRequestException("Quiz attempt not found");
    }

    // Make sure this attempt belongs to the logged-in student
    if (attempt.studentId !== studentId) {
      throw new badRequestException(
        "You are not allowed to submit this attempt",
      );
    }

    // Prevent submitting the same attempt twice
    if (attempt.completedAt) {
      throw new badRequestException("Quiz attempt has already been submitted");
    }

    const questions = await this.quizQuestionRepository.model
      .where({ quizId: attempt.quizId })
      .include("answers")
      .all();

    if (!questions.length) {
      throw new badRequestException("Quiz has no questions");
    }

    // ============================================================

    if (!Array.isArray(answers)) {
      throw new badRequestException("Answers must be an array");
    }

    // Prevent submitting the same question more than once
    const submittedQuestionIds = new Set<string>();

    for (const submittedAnswer of answers) {
      if (submittedQuestionIds.has(submittedAnswer.questionId)) {
        throw new badRequestException(
          `Question ${submittedAnswer.questionId} was submitted more than once`,
        );
      }

      submittedQuestionIds.add(submittedAnswer.questionId);
    }

    // Make sure every submitted question belongs to this quiz
    for (const submittedAnswer of answers) {
      const question = questions.find(
        (question) => question.id === submittedAnswer.questionId,
      );

      if (!question) {
        throw new badRequestException(
          `Question ${submittedAnswer.questionId} does not belong to this quiz`,
        );
      }

      if (submittedAnswer.answerId) {
        const questionAnswers = Array.isArray(question.answers)
          ? question.answers
          : [];

        const answerExists = questionAnswers.some(
          (answer) => answer.id === submittedAnswer.answerId,
        );

        if (!answerExists) {
          throw new badRequestException(
            `Answer does not belong to question ${question.id}`,
          );
        }
      }
    }

    let score = 0;
    let totalPoints = 0;

    const quizAnswersToCreate = [];

    for (const question of questions) {
      const questionPoints = Number(question.points);

      totalPoints += questionPoints;

      const submittedAnswer = answers.find(
        (answer) => answer.questionId === question.id,
      );

      if (!submittedAnswer) {
        quizAnswersToCreate.push({
          attemptId: attempt.id,
          questionId: question.id,
          answerId: null,
          textAnswer: null,
          isCorrect: false,
          points: "0",
        });

        continue;
      }

      const questionAnswers = Array.isArray(question.answers)
        ? question.answers
        : [];

      const correctAnswer = questionAnswers.find(
        (answer) => answer.isCorrect === true,
      );

      const isCorrect =
        !!correctAnswer && submittedAnswer.answerId === correctAnswer.id;

      const earnedPoints = isCorrect ? questionPoints : 0;

      if (isCorrect) {
        score += earnedPoints;
      }

      quizAnswersToCreate.push({
        attemptId: attempt.id,
        questionId: question.id,
        answerId: submittedAnswer.answerId ?? null,
        textAnswer: submittedAnswer.textAnswer ?? null,
        isCorrect,
        points: earnedPoints.toString(),
      });
    }

    const percentage = totalPoints === 0 ? 0 : (score / totalPoints) * 100;

    for (const quizAnswer of quizAnswersToCreate) {
      await this.quizAnswerRepository.create(quizAnswer);
    }

    const updatedAttempt = await this.quizAttemptRepository.update({
      where: {
        id: attempt.id,
      },

      update: {
        score: score.toString(),
        percentage: percentage.toString(),
        completedAt: new Date(),
      },
    });

    return {
      attempt: updatedAttempt,
      score,
      totalPoints,
      percentage,
    };
  }
}
const quizService = new QuizService();
export default quizService;
