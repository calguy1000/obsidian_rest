import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import authMiddleware from '../../middleware/authMiddleware';

const app = express();
const config = { apiKey: 'testapikey' };
app.use(authMiddleware(config));

app.get('/test', (req, res) => {
    res.status(200).json({ message: 'Success' });
});

describe('authMiddleware', () => {
    it('should return 401 if Authorization header is missing', async () => {
        const response = await request(app).get('/test');
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Authorization header missing');
    });

    it('should return 401 if token is missing', async () => {
        const response = await request(app)
            .get('/test')
            .set('authorization', 'Bearer ');
        expect(response.body.message).toBe('Token missing');
        expect(response.status).toBe(401);
    });

    it('should return 403 if token is invalid', async () => {
        const response = await request(app)
            .get('/test')
            .set('authorization', 'Bearer invalidtoken');
        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Invalid token');
    });

    it('should call next if token is valid', async () => {
        const token = jwt.sign({ userId: 1 }, config.apiKey, { expiresIn: '1h' });
        const response = await request(app)
            .get('/test')
            .set('authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Success');
    });

    // Add more tests as needed
});
