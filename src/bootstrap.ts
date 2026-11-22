import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import { Temporal } from "temporal-polyfill";
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
  app.use((req, res) => {
    res.status(404).json({
      message: "Route not found",
    });
  });
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const validationErrors = Array.isArray(err.validationErrors)
      ? err.validationErrors.map((issue: any) => {
          const path = Array.isArray(issue.path) ? issue.path.filter((part: unknown) => part !== "body" && part !== "query" && part !== "params") : [];
          return {
            field: path.length ? path.join(".") : "form",
            path,
            message: issue.message || "Invalid value",
            code: issue.code,
          };
        })
      : null;
    const fieldErrors = validationErrors
      ? Object.fromEntries(validationErrors.map((issue: { field: string; message: string }) => [issue.field, issue.message]))
      : null;
    return res.status(err.statusCode || 500).json({
      success: false,
      statusCode: err.statusCode || 500,
      name: err.name,
      message: err.message,
      validationErrors,
      fieldErrors,
    });
  });

  app.listen(process.env.PORT, () => {
    console.log("🚀 Server running on port ", process.env.PORT);
  });
  // ------------------------socket io initializer----------------------------
};
export default bootstrap;
