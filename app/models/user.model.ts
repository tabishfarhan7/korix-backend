import { prisma } from '../database/database.js';

export const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({ where: { email } });
};

export const findUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
};

export const createUser = async (data: { email: string; name: string; password: string }) => {
    return prisma.user.create({
        data,
        select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
};
