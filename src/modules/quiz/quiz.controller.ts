import { NextFunction, Request, Response, Router } from "express";
import { auth, authorize, validate } from "../../middlewares";
import { UserRole } from "../../interfaces";

import { successResult } from "../../common";
import { createQuizSchema, startQuiz, submitQuiz } from "./quiz.validation";
import quizService from "./quiz.service";
import { CreateQuizDTO, startQuizParamsDTO, SubmitQuizDTO } from "./quiz.dto";

const router = Router();

router.get(
  "/:quizId",
  auth(),
  authorize([UserRole.STUDENT]),
  async (req: Request, res: Response) => {
    const data = await quizService.getQuiz(req.params.quizId as string);
    return successResult({ res, data, message: "quiz retrieved", statusCode: 200 });
  },
);

router.post(
  "/create-quiz",
  auth(),
  authorize([UserRole.TEACHER]),
  validate(createQuizSchema),

  async (req: Request, res: Response, next: NextFunction) => {
    const data = await quizService.createQuiz(req.body as CreateQuizDTO);
    return successResult({
      res,
      data,
      message: "quiz created",
      statusCode: 201,
    });
  },
);
router.post(
  "/start-quiz/:quizId",
  auth(),
  authorize([UserRole.STUDENT]),
  validate(startQuiz),

  async (req: Request, res: Response, next: NextFunction) => {
    const data = await quizService.startQuiz(
      req.params as startQuizParamsDTO,
      req.user.id as string,
    );
    return successResult({
      res,
      data,
      message: "quiz started",
      statusCode: 200,
    });
  },
);
router.post(
  "/submit-quiz",
  auth(),
  authorize([UserRole.STUDENT]),
  validate(submitQuiz),

  async (req: Request, res: Response, next: NextFunction) => {
    const data = await quizService.submitQuiz(
      req.user.id as string,
      req.body as SubmitQuizDTO,
    );
    return successResult({
      res,
      data,
      message: "quiz submitted",
      statusCode: 200,
    });
  },
);

export default router;
