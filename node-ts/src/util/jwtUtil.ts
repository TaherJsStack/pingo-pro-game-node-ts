import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

export const generateToken = (userId: string, email: string, username: string, userRoles: number, permeation: number[]): string => {
    const token = jwt.sign({
        userId:     userId,
        email:      email,
        name:       username,
        role:       userRoles,
        permeation: permeation
    }, process.env.SECRET!, { expiresIn: "3d" });
    return token;
}

export const generateBcryptHash = async (password: string, salt: number): Promise<string> => {
    return await bcrypt.hash(password, salt);
}

export const compareBcryptHash = async (password: string, savedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, savedPassword);
}

export const verifyToken = (roles: { userType: string }[]) => {
    return async (req: any, res: any, next: any) => {
        try {
            const { token } = req.headers;
            // console.log("token : " + token);
            if (!token) {
                // console.log("No token exist");
                return res.status(500).send({ error: 'Token is not exist' });
            }
            // should validate if loggedIn user has the same role
            const decode: any = jwt.verify(token, process.env.SECRET!);
            // console.log("decode:" + JSON.stringify(decode));
            req.user = {
                userId: decode.userId,
                username: decode.username,
                email: decode.email,
                fullname: decode.fullname,
                roles: decode.roles,
                userType: roles
            };
            // console.log("roles : " + roles);

            if (!hasRole(roles, decode.roles)) {
                // console.log("Error : not have the same role");
                return res.status(401).send({ error: 'Authentication failed' });
            }
            // console.log("valid token");
            next();
        } catch (error) {
            next(error);
        }

    }
}

const hasRole = (routeRoles: { userType: string }[], userRoles: string[]): boolean => {
    // console.log("routeRoles : " + routeRoles);
    let result = false;
    userRoles.forEach(role => {
        if (routeRoles.map(r => r.userType).includes(role)) {
            result = true;
            return;
        }
    });
    // console.log("result : " + result);
    return result;
}
