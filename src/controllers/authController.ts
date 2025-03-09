import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

interface Config {
    apiKey: string;
    privateDir: string;
}

class AuthController {
    private apiKey: string;
    private tokenPath: string;

    constructor(config: Config) {
        this.apiKey = config.apiKey;
        this.tokenPath = path.join(config.privateDir, 'token.json');
        if (!this.apiKey) {
            const error = new Error('API key must be provided');
            logger.error(error.message);
            throw error;
        }
    }

    public authenticate(req: Request, res: Response): Response {
        const apiKey = req.headers['x-api-key'] as string;
        if (apiKey !== this.apiKey) {
            logger.error('Invalid API key');
            return res.status(401).json({ message: 'Token error' }); // obfuscated error message
        }

        if (fs.existsSync(this.tokenPath)) {
            const tokenStats = fs.statSync(this.tokenPath);
            const tokenAge = (Date.now() - tokenStats.mtime.getTime()) / 1000 / 60; // in minutes
            if (tokenAge < 60) {
                logger.error('Token is too recent');
                return res.status(400).json({ message: 'Token error 1012' });  // just a bit of obfuscation
            }
        }

        const token = jwt.sign({}, this.apiKey, { expiresIn: '30d' });
        fs.writeFileSync(this.tokenPath, JSON.stringify({ token }));

        logger.info('Authentication successful');
        return res.status(200).json({ 
            token:   token,
            message: 'Authentication successful' }
        );
    }
}

export default AuthController;
