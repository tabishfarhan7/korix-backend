import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, findUserById, createUser } from '../models/user.model.js';
import { JWT_SECRET, JWT_REFRESH_SECRET } from '../config/env.js';
import redisClient from '../database/redis.js';


const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: false, 
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, 
};

const generateAccessToken = (userId: string): string =>
    jwt.sign({ userId }, JWT_SECRET!, { expiresIn: '15m' });

const generateRefreshToken = (userId: string): string =>
    jwt.sign({ userId }, JWT_REFRESH_SECRET!, { expiresIn: '7d' });

const refreshKey = (userId: string) => `refresh:${userId}`;


export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, name, password } = req.body as {
            email: string;
            name: string;
            password: string;
        };

        if (!email || !name || !password) {
            res.status(400).json({ message: 'Email, name and password are required' });
            return;
        }

        const existing = await findUserByEmail(email);
        if (existing) {
            res.status(409).json({ message: 'An account with this email already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await createUser({ email, name, password: hashedPassword });

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        await redisClient.set(refreshKey(user.id), refreshToken, { EX: 604800 });

        res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

        res.status(201).json({
            message: 'Account created successfully',
            accessToken,
            user,
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body as { email: string; password: string };

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const user = await findUserByEmail(email);
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        
        await redisClient.set(refreshKey(user.id), refreshToken, { EX: 604800 });

        res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            message: 'Login successful',
            accessToken,
            user: userWithoutPassword,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = (req.cookies as Record<string, string | undefined>)?.refresh_token;

        if (!token) {
            res.status(401).json({ message: 'No refresh token provided' });
            return;
        }

        const decoded = jwt.verify(token, JWT_REFRESH_SECRET!) as { userId: string };

        const stored = await redisClient.get(refreshKey(decoded.userId));
        if (!stored || stored !== token) {
            res.status(401).json({ message: 'Refresh token is invalid or has been revoked' });
            return;
        }

        // Rotate: issue a fresh refresh token and update Redis
        const newAccessToken = generateAccessToken(decoded.userId);
        const newRefreshToken = generateRefreshToken(decoded.userId);

        await redisClient.set(refreshKey(decoded.userId), newRefreshToken, { EX: 604800 });
        res.cookie('refresh_token', newRefreshToken, REFRESH_COOKIE_OPTIONS);

        res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
        console.error('Refresh error:', err);
        res.status(401).json({ message: 'Unauthorized: Invalid or expired refresh token' });
    }
};

export const profile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await findUserById((req as any).userId as string);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({ user });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).userId as string;
        await redisClient.del(refreshKey(userId));

        res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS);
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
