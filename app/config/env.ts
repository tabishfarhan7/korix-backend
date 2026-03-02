import { configDotenv } from "dotenv";
configDotenv();

export const { PORT, DATABASE_URL, JWT_SECRET } = process.env;
