import { Router } from 'express';
import AuthController from '../controllers/authController';

const authRoutes = (authController: AuthController, router: Router) => {
    router.put('/', authController.authenticate.bind(authController));
    return router;
};

export default authRoutes;
