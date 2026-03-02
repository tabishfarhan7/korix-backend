import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

interface JwtPayload {
    userId: string;
}

// Reads the JWT from the httpOnly cookie and attaches userId to the request
export const protect = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const token = (req.cookies as Record<string, string | undefined>)?.jwt;

        if (!token) {
            res.status(401).json({ message: 'Unauthorized: No token provided' });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
        (req as any).userId = decoded.userId;

        next();
    } catch {
        res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
};
