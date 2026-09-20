import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import { Temporal } from "temporal-polyfill";
import { NotFoundException } from "./common";
import { redisService } from "./common/services";
import { authRouter } from "./modules/auth";
import { courseRouter } from "./modules/course";
import { userRouter } from "./modules/users";
import { adminRouter } from "./modules/admin";
import { enrollmentRouter } from "./modules/enrollment";
import { lessonRouter } from "./modules/lesson";
import { paymentRouter } from "./modules/payment";
import { quizRouter } from "./modules/quiz";
import { teacherRouter } from "./modules/teacher";
import { connectDB } from "./prisma/connect";
(globalThis as any).Temporal = Temporal;

const app: Express = express();

const bootstrap = async () => {
  app.use(express.json(), cors());
  await connectDB();
  await redisService.connectRedisDB();

  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/course", courseRouter);
  app.use("/admin", adminRouter);
  app.use("/enrollment", enrollmentRouter);
  app.use("/lesson", lessonRouter);
  app.use("/payment", paymentRouter);
  app.use("/quiz", quizRouter);
  app.use("/teacher", teacherRouter);

  app.get("/", async (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ data: "hello" });
  });
  app.all("/*", (req: Request, res: Response, next: NextFunction) => {
    throw new NotFoundException("invalid URL");
  });
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.log("🚀 ~ bootstrap ~ err:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      statusCode: err.statusCode || 500,
      name: err.name,
      message: err.message,
      validationErrors: err.validationErrors ?? null,
      stack: err.stack ?? undefined,
      cause: err.cause ?? undefined,
    });
  });

  app.listen(process.env.PORT, () => {
    console.log("🚀 Server running on port ", process.env.PORT);
  });
  // ------------------------socket io initializer----------------------------
};
export default bootstrap;
