import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import ListController from '../controllers/listController';
import logger from '../utils/logger';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import listRoutes from '../routes/listRoutes';
import authMiddleware from '../middleware/authMiddleware';

const app = express();
app.use(express.json());

const config = {
    obsidianVaultPath: '/app/test_vault', // Ensure this directory exists and is writable
    privateDir: '/app/private',
    apiKey: 'testapikey',
};
const listController = new ListController(config);
const authMiddlewareInstance = authMiddleware(config);
app.use('/api', listRoutes(authMiddlewareInstance, listController, express.Router()));

async function cleanLists() {
    // Remove all files from the vault directory
    const _path = path.join(config.obsidianVaultPath, 'Lists');
    const files = await fs.promises.readdir(_path);
    for (const file of files) {
        await fs.promises.unlink(path.join(_path, file));
    }
}

describe('ListController', () => {
    describe('getLists', () => {
        it('should return 400 if Lists directory does not exist', async () => {
            const response = await request(app)
                .get('/api/list')
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Lists directory does not exist');
        });
    });
});

describe('ListController', () => {
    beforeAll(async () => {
        // Ensure the vault directory exists
        const _path = path.join(config.obsidianVaultPath, 'Lists');
        if (!fs.existsSync(_path)) {
            await fs.promises.mkdir(_path, { recursive: true });
        }
    });

    afterAll(async () => {
        // Remove the vault directory
        await fs.promises.rmdir(config.obsidianVaultPath, { recursive: true });
    });

    describe('getLists', () => {
        /*
         * this doesn't work when tests are run as root
        it('should return 500 if an error occurs while reading the directory', async () => {
            // Create a dummy unwritable markdown file in the Lists directory
            const dummyFilePath = path.join(config.obsidianVaultPath, 'Lists', 'unwritable.md');
            await fs.promises.writeFile(dummyFilePath, 'dummy content');
            await fs.promises.chmod(dummyFilePath, 0o444); // Make the file readable but not writable

            const response = await request(app)
                .get('/api/list')
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            // Clean up: remove the dummy file and restore permissions
            await fs.promises.chmod(dummyFilePath, 0o644);
            await fs.promises.unlink(dummyFilePath);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error reading lists directory');
            expect(logger.error).toHaveBeenCalledWith('Error reading lists directory', expect.any(Error));
        });
        */

        it('should return an empty list if there are no markdown files', async () => {
            // Mock the fs.readdirSync to return an empty array
            jest.spyOn(fs.promises, 'readdir').mockResolvedValue([]);

            const response = await request(app)
                .get('/api/list')
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('should return a list of markdown files', async () => {
            // Create dummy markdown files
            const file1Path = path.join(config.obsidianVaultPath, 'Lists', 'file1.md');
            const file2Path = path.join(config.obsidianVaultPath, 'Lists', 'file2.md');
            await fs.promises.writeFile(file1Path, 'dummy content');
            await fs.promises.writeFile(file2Path, 'dummy content');

            const response = await request(app)
                .get('/api/list')
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            await cleanLists();

            expect(response.status).toBe(200);
            expect(response.body).toEqual(['file1', 'file2']);
        });
    });

    describe('getList', () => {
        it('should return 400 if file name is invalid', async () => {
            const response = await request(app)
                .get('/api/list/.invalidFile')
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid file name');
        });

        it('should return 404 if the file does not exist', async () => {
            const response = await request(app)
                .get('/api/list/validFile')
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('File does not exist');
        });

        it('should return the file content', async () => {
            const filePath = path.join(config.obsidianVaultPath, 'Lists', 'validFile.md');
            await fs.promises.writeFile(filePath, 'file content');

            const response = await request(app)
                .get('/api/list/validFile')
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);
            
            await cleanLists();

            expect(response.status).toBe(200);
            expect(response.body.content).toBe('file content');
        });
    });

    describe('addItem', () => {
        it('should return 400 if file name is invalid', async () => {
            const response = await request(app)
                .post('/api/list/.invalidFile')
                .send({ text: 'item text' })
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid file name');
        });

        it('should return 400 if text is invalid', async () => {
            const response = await request(app)
                .post('/api/list/validFile')
                .send({ text: '' })
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid text');
        });

        /*
         * this test doesn't work when tests are run as root   
        it('should return 403 if file is not readable or writable', async () => {
            const response = await request(app)
                .post('/api/list/validFile')
                .send({ text: 'item text' })
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('File is not readable or writable');
        });

        it('should return 500 if an error occurs while appending the item', async () => {
            const response = await request(app)
                .post('/api/list/validFile')
                .send({ text: 'item text' })
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error appending item to file');
            expect(logger.error).toHaveBeenCalledWith('Error appending item to file', expect.any(Error));
        });
        */

        it('should add the item to the file', async () => {
            const response = await request(app)
                .post('/api/list/validFile')
                .send({ text: 'item text' })
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            await cleanLists();
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Item added successfully');
        });
    });

    describe('deleteItem', () => {
        it('should return 400 if file name is invalid', async () => {
            const response = await request(app)
                .delete('/api/list/.invalidFile')
                .send({ text: 'item text' })
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid file name');
        });

        it('should return 400 if text is invalid', async () => {
            const response = await request(app)
                .delete('/api/list/validFile')
                .send({ text: '' })
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid text');
        });

        /**
         * this test doesn't work when tests are run as root
        it('should return 403 if file is not readable or writable', async () => {
            const response = await request(app)
                .delete('/api/list/validFile')
                .send({ text: 'item text' })
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('File is not readable or writable');
        });
        */

        it('should return 500 if an error occurs while deleting the item', async () => {
            const response = await request(app)
                .delete('/api/list/validFile')
                .send({ text: 'item text' })
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error deleting from file');
            //expect(logger.error).toHaveBeenCalledWith('Error deleting from file', expect.any(Error));
        });

        it('should delete the item from the file', async () => {
            const filePath = path.join(config.obsidianVaultPath, 'Lists', 'validFile.md');
            await fs.promises.writeFile(filePath, '- item text\n');

            const response = await request(app)
                .delete('/api/list/validFile')
                .send({ text: 'item text' })
                .set('authorization', `Bearer ${jwt.sign({}, config.apiKey, { expiresIn: '1h' })}`);

            await cleanLists();

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Item deleted successfully');
        });
    });
});