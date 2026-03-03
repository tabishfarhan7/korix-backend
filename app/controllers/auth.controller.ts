import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, findUserById, createUser } from '../models/user.model.js';
import { JWT_SECRET } from '../config/env.js';

// Cookie config — httpOnly so JS can't touch it, secure in production
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: false,
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};


const generateToken = (userId: string): string =>
    jwt.sign({ userId }, JWT_SECRET!, { expiresIn: '7d' });

// POST /api/auth/register
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

        const token = generateToken(user.id);
        res.cookie('jwt', token, COOKIE_OPTIONS);

        res.status(201).json({
            message: 'Account created successfully',
            user,
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body as { email: string; password: string };

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const user = await findUserByEmail(email);
        if (!user) {
            // Same message for both cases — don't leak which one failed
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        const token = generateToken(user.id);

        // Strip password before sending response
        const { password: _, ...userWithoutPassword } = user;

        res.cookie('jwt', token, COOKIE_OPTIONS);
        res.status(200).json({
            message: 'Login successful',
            user: userWithoutPassword,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// GET /api/auth/profile  — protected
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

// POST /api/auth/logout  — protected
export const logout = (_req: Request, res: Response): void => {
    res.clearCookie('jwt', COOKIE_OPTIONS);
    res.status(200).json({ message: 'Logged out successfully' });
};
