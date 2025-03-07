import { Router } from 'express';
import VaultController from '../controllers/vaultController';
import authMiddleware from '../middleware/authMiddleware';
import express from 'express';

const vaultRoutes = (authMiddleware: any, vaultController: VaultController, router: Router) => {
    router.use(authMiddleware);
    router.use(express.json()); // Ensure all requests are JSON

    router.get('/vault', vaultController.listFiles.bind(vaultController));
    router.get('/vault/:filename', vaultController.getFile.bind(vaultController));
    router.patch('/vault/:filename', vaultController.appendFile.bind(vaultController));
    router.delete('/vault/:filename', vaultController.deleteFile.bind(vaultController));
    router.post('/vault', vaultController.createFile.bind(vaultController));

    return router;
};

export default vaultRoutes;