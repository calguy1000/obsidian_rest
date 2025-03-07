import { Router } from 'express';
import { getLandingPage } from '../controllers/landingController';

const router = Router();

router.get('/', getLandingPage);

export default router;