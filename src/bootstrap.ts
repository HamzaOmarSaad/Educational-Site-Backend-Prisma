import express, { Express, NextFunction, Request, Response } from "express";
import { connectDB } from "./prisma/connect";
import { db } from "./prisma/db";
import redisService from "./common/services";
import { NotFoundException } from "./common";

const app: Express = express();

const bootstrap = async () => {
  app.use(express.json());
  await connectDB();
  await redisService.connectRedisDB();

  app.post("/user", async (req: Request, res: Response, next: NextFunction) => {
    const user = await db.orm.public.User.create({
      email: "test@test.com",
      name: "ass",
      password: "hamzahamza",
      role: "TEACHER",
    });
    return res.status(200).json({ data: user });
  });
  app.all("{/*dummy}", (req: Request, res: Response, next: NextFunction) => {
    throw new NotFoundException("invalid URL");
  });
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    return res.status(err.statusCode || 500).json({
      success: false,
      statusCode: err.statusCode || 500,
      name: err.name,
      message: err.message,
      validationErrors: err.validationErrors ?? null,
      stack: err.stack ?? undefined,
    });
  });

  app.listen(process.env.PORT, () => {
    console.log("🚀 Server running on port ", process.env.PORT);
  });
  // ------------------------socket io initializer----------------------------
};
export default bootstrap;
