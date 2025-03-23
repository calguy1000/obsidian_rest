import express, { Router } from 'express';
import ListController from '../controllers/listController';
import AuthMiddleware from '../middleware/authMiddleware';

export default (authMiddleware: any, listController: ListController, router: Router) => {
    router.use(authMiddleware);
    router.use(express.json()); // Ensure all requests are JSON

    router.get('/list', (req, res) => listController.getLists(req, res));
    router.get('/list/:id', (req, res) => listController.getList(req, res));
    router.post('/list/:id', (req, res) => listController.addItem(req, res));
    router.delete('/list/:id', (req, res) => listController.deleteItem(req, res));

    return router;
};
