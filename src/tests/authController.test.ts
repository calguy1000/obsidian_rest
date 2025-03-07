import request from 'supertest';
import express from 'express';
import AuthController from '../controllers/authController';
import authRoutes from '../routes/authRoutes';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());

const config = { 
    apiKey: 'testapikey',
    privateDir: './', // Ensure this directory exists and is writable
};
const authController = new AuthController(config);
app.use('/auth', authRoutes(authController, express.Router()));

describe('AuthController', () => {
    beforeAll(() => {
        // Ensure the private directory exists
        if (!fs.existsSync(config.privateDir)) {
            fs.mkdirSync(config.privateDir);
        }
    });

    afterEach(() => {
        // Clean up the token file after each test
        const tokenPath = path.join(config.privateDir, 'token.json');
        if (fs.existsSync(tokenPath)) {
            fs.unlinkSync(tokenPath);
        }
    });

    it('should return a JWT token on successful authentication', async () => {
        const response = await request(app)
            .put('/auth')
            .set('x-api-key', 'testapikey');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body.message).toBe('Authentication successful');
    });

    it('should return 401 if API key is missing', async () => {
        const response = await request(app)
            .put('/auth');
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Token error');
    });

    it('should return 401 if API key is incorrect', async () => {
        const response = await request(app)
            .put('/auth')
            .set('x-api-key', 'wrongapikey');
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Token error');
    });

    it('should return 400 if token is too recent', async () => {
        // Create a token file with a recent timestamp
        const tokenPath = path.join(config.privateDir, 'token.json');
        fs.writeFileSync(tokenPath, JSON.stringify({ token: 'dummy' }));
        const response = await request(app)
            .put('/auth')
            .set('x-api-key', 'testapikey');
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Token error 1012');
    });

    it('should return 403 on invalid token', async () => {
        const response = await request(app)
            .put('/auth')
            .set('authorization', 'Bearer invalidtoken');
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Token error');
    });

    // Add more tests as needed
});