import fs from 'fs';
import path from 'path';
import logger from './logger';

export const checkEnvVariables = () => {
    if (!process.env.OBSIDIAN_VAULT_PATH) {
        const error = new Error('Environment variable OBSIDIAN_VAULT_PATH must be set');
        logger.error(error.message);
        throw error;
    }

    const obsidianVaultPath = process.env.OBSIDIAN_VAULT_PATH;
    if (!fs.existsSync(obsidianVaultPath)) {
        const error = new Error(`Obsidian vault path ${obsidianVaultPath} does not exist`);
        logger.error(error.message);
        throw error;
    } else {
        try {
            fs.accessSync(obsidianVaultPath, fs.constants.W_OK);
        } catch (err) {
            const error = new Error(`Obsidian vault path ${obsidianVaultPath} is not writable`);
            logger.error(error.message);
            throw error;
        }
    }

    const privateDir = process.env.PRIVATE_DIR || path.join(__dirname, '../../private');
    if (!fs.existsSync(privateDir)) {
        fs.mkdirSync(privateDir, { recursive: true });
    } else {
        try {
            fs.accessSync(privateDir, fs.constants.W_OK);
        } catch (err) {
            const error = new Error(`Private directory ${privateDir} is not writable`);
            logger.error(error.message);
            throw error;
        }
    }

    return {
        apiKey: process.env.API_KEY!,
        obsidianVaultPath,
        privateDir,
    };
};
