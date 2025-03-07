import fs from 'fs';
import path from 'path';

export const checkEnvVariables = () => {
    if (!process.env.OBSIDIAN_VAULT_PATH) {
        throw new Error('Environment variable OBSIDIAN_VAULT_PATH must be set');
    }

    const obsidianVaultPath = process.env.OBSIDIAN_VAULT_PATH;
    if (!fs.existsSync(obsidianVaultPath)) {
        throw new Error(`Obsidian vault path ${obsidianVaultPath} does not exist`);
    } else {
        try {
            fs.accessSync(obsidianVaultPath, fs.constants.W_OK);
        } catch (err) {
            throw new Error(`Obsidian vault path ${obsidianVaultPath} is not writable`);
        }
    }

    const privateDir = process.env.PRIVATE_DIR || path.join(__dirname, '../../private');
    if (!fs.existsSync(privateDir)) {
        fs.mkdirSync(privateDir, { recursive: true });
    } else {
        try {
            fs.accessSync(privateDir, fs.constants.W_OK);
        } catch (err) {
            throw new Error(`Private directory ${privateDir} is not writable`);
        }
    }

    return {
        apiKey: process.env.API_KEY!,
        obsidianVaultPath,
        privateDir,
    };
};
