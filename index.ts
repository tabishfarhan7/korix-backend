<<<<<<< Updated upstream
import express, { Application, Request, Response } from "express";
import { PORT } from "./app/config/env.js";

const app: Application = express();
=======
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './app/routers/auth.router.js';
import { PORT } from './app/config/env.js';

const app = express();
>>>>>>> Stashed changes

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Needed to read httpOnly cookies

// Routes
app.use('/api/auth', authRouter);

<<<<<<< Updated upstream
app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");
});

app.listen(PORT || 8000, () => {
    console.log(`Server started on port http://localhost:${PORT || 8000}`);
=======
// Health check
app.get('/', (_req, res) => {
    res.json({ message: 'Korix API is running 🚀' });
});

const port = Number(PORT) || 8000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
>>>>>>> Stashed changes
});
