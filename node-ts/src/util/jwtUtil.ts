import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export const generateToken = (userId: string, email: string, username: string, userRoles: number, permission: number[]): string => {
    const token = jwt.sign({
        userId:     userId,
        email:      email,
        name:       username,
        role:       userRoles,
        permission: permission
    }, env.secret, { expiresIn: "3d" });
    return token;
}

export const generateBcryptHash = async (password: string, salt: number): Promise<string> => {
    return await bcrypt.hash(password, salt);
}

export const compareBcryptHash = async (password: string, savedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, savedPassword);
}
