import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../models/user";
import { Event } from "../models/event";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "callalertsystem",
  entities: [User, Event],
  synchronize: true, // Set to false in production
  logging: false,
});

export async function connectDB() {
  try {
    await AppDataSource.initialize();
    console.log("PostgreSQL connected");
  } catch (error) {
    console.error("PostgreSQL connection error:", error);
    process.exit(1);
  }
}
