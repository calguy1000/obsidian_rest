import { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

interface Config {
    apiKey: string;
    privateDir: string;
    obsidianVaultPath: string;
}

class VaultController {
    private vaultPath: string;

    constructor(config: Config) {
        this.vaultPath = config.obsidianVaultPath;
        process.stdout.write('Vault path: ' + __dirname + "/" + this.vaultPath + "\n");
        if (!this.vaultPath || !fs.existsSync(this.vaultPath) || !fs.lstatSync(this.vaultPath).isDirectory()) {
            const error = new Error('The vault path must be set to a valid directory');
            logger.error(error.message);
            throw error;
        }

        const files = fs.readdirSync(this.vaultPath);
        const mdFiles = files.filter(file => path.extname(file) === '.md');
        if (mdFiles.length === 0) {
            const error = new Error('The vault directory must contain at least one .md file');
            logger.error(error.message);
            throw error;
        }

        for (const file of files) {
            const filePath = path.join(this.vaultPath, file);
            try {
                fs.accessSync(filePath, fs.constants.W_OK);
            } catch (err) {
                const error = new Error(`File ${file} is not writable`);
                logger.error(error.message);
                throw error;
            }
        }
    }

    private getDailyFileName(): string {
        const today = new Date().toISOString().split('T')[0];
        return `${today}.md`;
    }

    public listFiles(req: Request, res: Response): Response {
        try {
            const files = fs.readdirSync(this.vaultPath);
            const mdFiles = files.filter(file => path.extname(file) === '.md' && /^[a-zA-Z0-9]/.test(file));
            const readableFiles = mdFiles.filter(file => {
                const filePath = path.join(this.vaultPath, file);
                try {
                    fs.accessSync(filePath, fs.constants.R_OK);
                    return true;
                } catch {
                    return false;
                }
            });
            return res.status(200).json(readableFiles);
        } catch (err) {
            logger.error('Error reading vault directory', err);
            return res.status(500).json({ message: 'Error reading vault directory' });
        }
    }

    public getFile(req: Request, res: Response): Response {
        const fileName = req.params.filename;
        if (!fileName || path.extname(fileName) !== '.md' || !/^[a-zA-Z0-9]/.test(fileName)) {
            return res.status(400).json({ message: 'Invalid file name' });
        }

        const filePath = path.join(this.vaultPath, fileName);
        if (!filePath.startsWith(this.vaultPath) || path.dirname(filePath) !== this.vaultPath) {
            return res.status(400).json({ message: 'Invalid file path' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        try {
            fs.accessSync(filePath, fs.constants.R_OK);
        } catch {
            return res.status(403).json({ message: 'File is not readable' });
        }

        try {
            const stats = fs.statSync(filePath);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const isWritable = fs.accessSync(filePath, fs.constants.W_OK) === undefined;
            return res.status(200).json({
                content: fileContent,
                stats: {
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                    isWritable: isWritable
                }
            });
        } catch (err) {
            logger.error('Error reading file', err);
            return res.status(500).json({ message: 'Error reading file' });
        }
    }

    public appendFile(req: Request, res: Response): Response {
        const { content } = req.body;
        const fileName = req.params.filename;
        if (!fileName || path.extname(fileName) !== '.md' || !/^[a-zA-Z0-9]/.test(fileName)) {
            return res.status(400).json({ message: 'Invalid file name' });
        }

        if (typeof content !== 'string' || content.length > 65536) {
            return res.status(400).json({ message: 'Invalid content' });
        }

        const filePath = path.join(this.vaultPath, fileName);
        if (!filePath.startsWith(this.vaultPath) || path.dirname(filePath) !== this.vaultPath) {
            return res.status(400).json({ message: 'Invalid file path' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        try {
            fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
        } catch {
            return res.status(403).json({ message: 'File is not readable or writable' });
        }

        try {
            fs.appendFileSync(filePath, content);
            return res.status(200).json({ message: 'Content appended successfully' });
        } catch (err) {
            logger.error('Error appending to file', err);
            return res.status(500).json({ message: 'Error appending to file' });
        }
    }

    public deleteFile(req: Request, res: Response): Response {
        const fileName = req.params.filename;
        if (!fileName || path.extname(fileName) !== '.md' || !/^[a-zA-Z0-9]/.test(fileName)) {
            return res.status(400).json({ message: 'Invalid file name' });
        }

        const filePath = path.join(this.vaultPath, fileName);
        if (!filePath.startsWith(this.vaultPath) || path.dirname(filePath) !== this.vaultPath) {
            return res.status(400).json({ message: 'Invalid file path' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        try {
            fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
        } catch {
            return res.status(403).json({ message: 'File is not readable or writable' });
        }

        try {
            fs.unlinkSync(filePath);
            return res.status(200).json({ message: 'File deleted successfully' });
        } catch (err) {
            logger.error('Error deleting file', err);
            return res.status(500).json({ message: 'Error deleting file' });
        }
    }

    public createFile(req: Request, res: Response): Response {
        // Implementation for creating a file
        const { fileName, title } = req.body;

        // Validate file name
        if (!fileName || path.extname(fileName) !== '.md' || !/^[a-zA-Z0-9]/.test(fileName) || fileName.includes('/')) {
            return res.status(400).json({ message: 'Invalid file name' });
        }

        const filePath = path.join(this.vaultPath, fileName);

        // Ensure the file path is within the vault directory
        if (!filePath.startsWith(this.vaultPath) || path.dirname(filePath) !== this.vaultPath) {
            return res.status(400).json({ message: 'Invalid file path' });
        }

        // Check if the file already exists
        if (fs.existsSync(filePath)) {
            return res.status(409).json({ message: 'File already exists' });
        }

        // Use the provided title or default to the file name
        const fileTitle = title || fileName;

        try {
            // Create the file with the title as content
            fs.writeFileSync(filePath, `# ${fileTitle}\n`);
            return res.status(201).json({ message: 'File created successfully' });
        } catch (err) {
            logger.error('Error creating file', err);
            return res.status(500).json({ message: 'Error creating file' });
        }
    }

    public getDailyFile(req: Request, res: Response): Response {
        const dailyFileName = this.getDailyFileName();
        const filePath = path.join(this.vaultPath, dailyFileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Daily file not found' });
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            return res.status(200).json({ content: fileContent });
        } catch (err) {
            logger.error('Error reading daily file', err);
            return res.status(500).json({ message: 'Error reading daily file' });
        }
    }

    public appendDailyFile(req: Request, res: Response): Response {
        const { content, withtime = true } = req.body;
        const dailyFileName = this.getDailyFileName();
        const filePath = path.join(this.vaultPath, dailyFileName);

        if (typeof content !== 'string' || content.length > 1024) {
            return res.status(400).json({ message: 'Invalid content' });
        }

        let contentToAppend = content;
        if (withtime) {
            const now = new Date();
            const timeString = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM format
            contentToAppend = `${timeString} ${content}`;
        }
        contentToAppend = `- ${contentToAppend}\n`;

        try {
            if (!fs.existsSync(filePath)) {
                const today = new Date().toISOString().split('T')[0];
                fs.writeFileSync(filePath, `# ${today}\n`);
            }
            fs.appendFileSync(filePath, contentToAppend);
            return res.status(200).json({ message: 'Content appended successfully' });
        } catch (err) {
            logger.error('Error appending to daily file', err);
            return res.status(500).json({ message: 'Error appending to daily file' });
        }
    }
}

export default VaultController;