import express, { Request, Response, Application } from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './app/routers/auth.router.js';
import { PORT } from './app/config/env.js';
import { connectRedis } from './app/database/redis.js';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 
app.use('/api/auth', authRouter);

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Korix API is running 🚀' });
});

const port = Number(PORT) || 8000;

const startServer = async () => {
    await connectRedis();
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
};

startServer();
