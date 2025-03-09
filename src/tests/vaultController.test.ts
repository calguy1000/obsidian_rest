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

describe('VaultController - Daily File Routes', () => {
    const dailyFileName = new Date().toISOString().split('T')[0] + '.md';
    const dailyFilePath = path.join(config.obsidianVaultPath, dailyFileName);

    beforeAll(() => {
        // Ensure the vault directory exists
        if (!fs.existsSync(config.obsidianVaultPath)) {
            fs.mkdirSync(config.obsidianVaultPath, { recursive: true });
        }
    });

    afterEach(() => {
        // Clean up the daily file after each test
        if (fs.existsSync(dailyFilePath)) {
            fs.unlinkSync(dailyFilePath);
        }
    });

    it('should return 404 if daily file does not exist', async () => {
        const response = await request(app)
            .get('/api/vault/daily')
            .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Daily file not found');
    });

    it('should return the content of the daily file if it exists', async () => {
        fs.writeFileSync(dailyFilePath, '# Daily Note\n');
        const response = await request(app)
            .get('/api/vault/daily')
            .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
        expect(response.status).toBe(200);
        expect(response.body.content).toBe('# Daily Note\n');
    });

    it('should append content to the daily file with timestamp', async () => {
        const content = 'New entry';
        const response = await request(app)
            .patch('/api/vault/daily')
            .send({ content, withtime: true })
            .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Content appended successfully');

        const fileContent = fs.readFileSync(dailyFilePath, 'utf-8');
        const now = new Date();
        const timeString = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM format
        expect(fileContent).toContain(`- ${timeString} ${content}\n`);
    });

    it('should append content to the daily file without timestamp', async () => {
        const content = 'New entry';
        const response = await request(app)
            .patch('/api/vault/daily')
            .send({ content, withtime: false })
            .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Content appended successfully');

        const fileContent = fs.readFileSync(dailyFilePath, 'utf-8');
        expect(fileContent).toContain(`- ${content}\n`);
    });

    it('should create a new daily file with title if it does not exist', async () => {
        const content = 'First entry';
        const response = await request(app)
            .patch('/api/vault/daily')
            .send({ content, withtime: false })
            .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Content appended successfully');

        const fileContent = fs.readFileSync(dailyFilePath, 'utf-8');
        const today = new Date().toISOString().split('T')[0];
        expect(fileContent).toContain(`# Daily Notes for ${today}\n`);
        expect(fileContent).toContain(`- ${content}\n`);
    });

    it('should undo the last appended content from the daily file', async () => {
        const content = 'New entry';
        const response = await request(app)
            .patch('/api/vault/daily')
            .send({ content, withtime: false })
            .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Content appended successfully');

        const undoResponse = await request(app)
            .patch('/api/vault/daily')
            .send({ content, undo: true })
            .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
        expect(undoResponse.status).toBe(200);
        expect(undoResponse.body.message).toBe('Last line removed successfully');

        const fileContent = fs.readFileSync(dailyFilePath, 'utf-8');
        expect(fileContent).not.toContain(`- ${content}\n`);
    });

});
