import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

class ListController {
    private config: any;

    constructor(config: any) {
        this.config = config;
    }

    /**
     * Retrieves a list of markdown files from the 'Lists' directory within the Obsidian vault path.
     * 
     * @param req - The request object.
     * @param res - The response object.
     * 
     * @returns A JSON response containing an array of markdown file names (without extensions) 
     *          that are readable and writable, or an error message if the directory does not exist 
     *          or an error occurs while reading the directory.
     * 
     * @throws Will return a 400 status if the 'Lists' directory does not exist.
     * @throws Will return a 500 status if an error occurs while reading the directory.
     */
    getLists(req: Request, res: Response) {
        const listsDir = path.join(this.config.obsidianVaultPath, 'Lists');
        if (!fs.existsSync(listsDir) || !fs.lstatSync(listsDir).isDirectory()) {
            return res.status(400).json({ message: 'Lists directory does not exist' });
        }

        try {
            const files = fs.readdirSync(listsDir);
            const mdFiles = files.filter(file => path.extname(file) === '.md' && !file.startsWith('.'));
            const readableWritableFiles = mdFiles.filter(file => {
                const filePath = path.join(listsDir, file);
                try {
                    fs.accessSync(filePath, fs.constants.R_OK);
                    fs.accessSync(filePath, fs.constants.W_OK);
                    return true;
                } catch {
                    return false;
                }
            });
            const fileNames = readableWritableFiles.map(file => path.basename(file, '.md'));
            return res.status(200).json(fileNames);
        } catch (err) {
            logger.error('Error reading lists directory', err);
            return res.status(500).json({ message: 'Error reading lists directory' });
        }
    }

    /**
     * Handles the request to get the content of a list file.
     * 
     * @param req - The request object, containing the list ID in the parameters.
     * @param res - The response object, used to send back the file content or an error message.
     * 
     * @returns A JSON response with the file content if successful, or an error message if the file is invalid, not readable, or not writable.
     * 
     * @remarks
     * - The list ID is expected to be provided in the request parameters.
     * - The file name is constructed from the list ID and must end with '.md'.
     * - The file must exist, be a regular file, and not start with a dot.
     * - The file must be readable and writable.
     * - If any of these conditions are not met, an appropriate error response is sent.
     */
    getList(req: Request, res: Response) {
        const listId = req.params.id;
        let fileName = `${listId}`;
        if (!fileName.endsWith('.md')) {
            fileName += '.md';
        }
        const filePath = path.join(this.config.obsidianVaultPath, 'Lists', fileName);

        if (!/^[a-zA-Z0-9]/.test(fileName)) {
            return res.status(400).json({ message: 'Invalid file name' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File does not exist' });
        }

        if (!fs.lstatSync(filePath).isFile()) {
            return res.status(500).json({ message: 'Entry is not a file' });
        }

        try {
            fs.accessSync(filePath, fs.constants.R_OK);
            fs.accessSync(filePath, fs.constants.W_OK);
        } catch {
            return res.status(403).json({ message: 'File is not readable or writable' });
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            return res.status(200).json({ content: fileContent });
        } catch (err) {
            logger.error('Error reading file', err);
            return res.status(500).json({ message: 'Error reading file' });
        }
    }

    /**
     * Adds an item to a specified list file.
     *
     * @param req - The request object containing the list ID in the URL parameters and the item text in the body.
     * @param res - The response object used to send back the appropriate HTTP status and message.
     * 
     * @returns A JSON response with a status code and message indicating the result of the operation.
     * 
     * @remarks
     * - The list file is identified by the `id` parameter in the request URL.
     * - The item text is provided in the request body.
     * - The list file must exist, be a valid file, and not be hidden.
     * - The item text must be a non-empty string with a maximum length of 1024 characters.
     * - The list file must be readable and writable.
     * 
     * @throws
     * - Returns a 400 status if the file name is invalid or the text is invalid.
     * - Returns a 403 status if the file is not readable or writable.
     * - Returns a 500 status if there is an error appending the item to the file.
     */
    addItem(req: Request, res: Response) {
        const listId = req.params.id;
        const { text } = req.body;
        let fileName = `${listId}`;
        if (!fileName.endsWith('.md')) {
            fileName += '.md';
        }
        const filePath = path.join(this.config.obsidianVaultPath, 'Lists', fileName);

        if (!/^[a-zA-Z0-9]/.test(fileName)) {
            return res.status(400).json({ message: 'Invalid file name' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File does not exist' });
        }

        if (!fs.lstatSync(filePath).isFile()) {
            return res.status(500).json({ message: 'Entry is not a file' });
        }

        if (typeof text !== 'string' || text.trim() === '' || text.length > 1024 || !/^[a-zA-Z0-9]/.test(text.trim())) {
            return res.status(400).json({ message: 'Invalid text' });
        }

        try {
            fs.accessSync(filePath, fs.constants.R_OK);
            fs.accessSync(filePath, fs.constants.W_OK);
        } catch {
            return res.status(403).json({ message: 'File is not readable or writable' });
        }

        try {
            const listItem = `- ${text.trim()}\n`;
            fs.appendFileSync(filePath, listItem);
            return res.status(200).json({ message: 'Item added successfully' });
        } catch (err) {
            logger.error('Error appending item to file', err);
            return res.status(500).json({ message: 'Error deleting item from file' });
        }
    }

    /**
     * Deletes an item from a markdown file in the Obsidian vault.
     *
     * @param req - The request object containing the list ID in the URL parameters and the text in the body.
     * @param res - The response object used to send back the appropriate HTTP status and message.
     * 
     * @returns A JSON response with a status code and message indicating the result of the operation.
     * 
     * @remarks
     * - The file name is derived from the list ID and must end with '.md'.
     * - The file must exist, be a file, and not start with a dot.
     * - The text must be a non-empty string with a maximum length of 1024 characters.
     * - The file must be readable and writable.
     * - The function searches backwards through the file to find the last occurrence of the text and deletes that line.
     * 
     * @throws
     * - Returns a 400 status if the file name or text is invalid.
     * - Returns a 403 status if the file is not readable or writable.
     * - Returns a 500 status if there is an error deleting from the file.
     */
    deleteItem(req: Request, res: Response) {
        const listId = req.params.id;
        const { text } = req.body;
        let fileName = `${listId}`;
        if (!fileName.endsWith('.md')) {
            fileName += '.md';
        }
        const filePath = path.join(this.config.obsidianVaultPath, 'Lists', fileName);

        if (!/^[a-zA-Z0-9]/.test(fileName)) {
            return res.status(400).json({ message: 'Invalid file name' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File does not exist' });
        }

        if (!fs.lstatSync(filePath).isFile()) {
            return res.status(500).json({ message: 'Entry is not a file' });
        }

        if (typeof text !== 'string' || text.trim() === '' || text.length > 1024) {
            return res.status(400).json({ message: 'Invalid text' });
        }

        try {
            fs.accessSync(filePath, fs.constants.R_OK);
            fs.accessSync(filePath, fs.constants.W_OK);
        } catch {
            return res.status(403).json({ message: 'File is not readable or writable' });
        }

        try {
            // search backwards through the file to find the last occurrence of the text
            // and then delete that line.
            let fileContent = fs.readFileSync(filePath, 'utf-8'); 
            const listItem = `- ${text.trim()}\n`;
            const lines = fileContent.split('\n');
            let itemFound = false;
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].trim() === listItem.trim()) {
                    lines.splice(i, 1);
                    itemFound = true;
                    break;
                }
            }
            if (!itemFound) {
                throw new Error('Item not found in the list');
            }
            fileContent = lines.join('\n');
            fs.writeFileSync(filePath, fileContent);
            return res.status(200).json({ message: 'Item deleted successfully' });
        } catch (err) {
            logger.error('Error deleting from file', err);
            return res.status(500).json({ message: 'Error deleting from file' });
        }
    }
}
    

export default ListController;
