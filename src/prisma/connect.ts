import { db } from "./db";

export async function connectDB() {
  try {
    await db.connect();

    console.log("✅ PostgreSQL connected successfully");
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error);
    process.exit(1);
  }
}
