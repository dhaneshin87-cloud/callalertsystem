import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./storage/database";
import authRoutes from "./routes/auth";
import eventRoutes from "./routes/event";
import { setupReminderJob } from "./cron/reminder";

dotenv.config();

const app = express();
app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
app.use(express.json());

app.use("/auth",authRoutes);
app.use("/events",eventRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    setupReminderJob();
  });
});
