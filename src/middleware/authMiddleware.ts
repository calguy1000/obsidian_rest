import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

interface Config {
    apiKey: string;
}

interface AuthenticatedRequest extends Request {
    user?: any;
}

const authMiddleware = (config: Config) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            logger.error('Authorization header missing');
            return res.status(401).json({ message: 'Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            logger.error('Token missing');
            return res.status(401).json({ message: 'Token missing' });
        }

        jwt.verify(token, config.apiKey, (err, decoded) => {
            if (err) {
                logger.error('Invalid token');
                return res.status(403).json({ message: 'Invalid token' });
            }

            req.user = decoded;
            next();
        });
    };
};

export default authMiddleware;