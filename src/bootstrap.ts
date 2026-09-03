import express, { Express, NextFunction, Request, Response } from "express";
import { connectDB } from "./prisma/connect";
import { db } from "./prisma/db";

const app: Express = express();

const bootstrap = async () => {
  app.use(express.json());
  await connectDB();

  app.post("/user", async (req: Request, res: Response, next: NextFunction) => {
    const user = await db.orm.public.User.create({
      email: "test@test.com",
      name: "ass",
      password: "hamzahamza",
      role: "TEACHER",
    });
    return res.status(200).json({ data: user });
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
    console.log("server running on port df ", process.env.PORT);
  });
  // ------------------------socket io initializer----------------------------
};
export default bootstrap;
