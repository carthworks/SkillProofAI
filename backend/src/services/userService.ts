import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUserByEmail = (email: string) => prisma.user.findUnique({ where: { email } });
export const createUser = (data: { name: string; email: string; password: string; domain: string }) =>
  prisma.user.create({ data });
