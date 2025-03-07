import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import VaultController from '../controllers/vaultController';
import vaultRoutes from '../routes/vaultRoutes';
import authMiddleware from '../middleware/authMiddleware';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());

const config = { 
    obsidianVaultPath: '/app/test_vault', // Ensure this directory exists and is writable
    privateDir: '/app/private',
    apiKey: 'testapikey',
};
const vaultController = new VaultController(config);
const authMiddlewareInstance = authMiddleware(config);
app.use('/api', vaultRoutes(authMiddlewareInstance, vaultController, express.Router()));

describe('VaultController', () => {
    beforeAll(() => {
        // Ensure the vault directory exists
        if (!fs.existsSync(config.obsidianVaultPath)) {
            fs.mkdirSync(config.obsidianVaultPath);
        }
        // Create a single dummy markdown file
        const dummyFilePath = path.join(config.obsidianVaultPath, 'dummy.md');
        fs.writeFileSync(dummyFilePath, '# Dummy File');
    });

    it('should list markdown files in the vault', async () => {
        // Create a test markdown file
        const testFilePath = path.join(config.obsidianVaultPath, 'test.md');
        fs.writeFileSync(testFilePath, '# Test');

        const response = await request(app)
            .get('/api/vault')
            .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
        expect(response.status).toBe(200);
        expect(response.body).toContain('test.md');

        // Clean up
        fs.unlinkSync(testFilePath);
    });

    it('should return 400 for invalid file name on getFile', async () => {
        const response = await request(app)
            .get('/api/vault/invalidfile')
            .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid file name');
    });

    it('should return 404 for non-existent file on getFile', async () => {
        const response = await request(app)
            .get('/api/vault/nonexistent.md')
            .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
        expect(response.body.message).toBe('File not found');
        expect(response.status).toBe(404);
    });

    it('should append content to an existing file', async () => {
        // Create a test markdown file
        const testFilePath = path.join(config.obsidianVaultPath, 'test.md');
        fs.writeFileSync(testFilePath, '# Test');

        const response = await request(app)
            .patch('/api/vault/test.md')
            .send({ content: '\nAppended content' })
            .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Content appended successfully');

        const fileContent = fs.readFileSync(testFilePath, 'utf-8');
        expect(fileContent).toContain('Appended content');

        // Clean up
        fs.unlinkSync(testFilePath);
    });

    it('should delete an existing file', async () => {
        // Create a test markdown file
        const testFilePath = path.join(config.obsidianVaultPath, 'test.md');
        fs.writeFileSync(testFilePath, '# Test');

        const response = await request(app)
            .delete('/api/vault/test.md')
            .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('File deleted successfully');

        expect(fs.existsSync(testFilePath)).toBe(false);
    });

    it('should create a new file', async () => {
        const response = await request(app)
            .post('/api/vault')
            .send({ fileName: 'newfile.md', title: 'New File' })
            .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('File created successfully');

        const filePath = path.join(config.obsidianVaultPath, 'newfile.md');
        expect(fs.existsSync(filePath)).toBe(true);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        expect(fileContent).toContain('# New File');

        // Clean up
        fs.unlinkSync(filePath);
    });

    // Add more tests as needed
});
