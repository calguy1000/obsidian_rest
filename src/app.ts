import express from 'express';
import landingRoutes from './routes/landingRoutes';
import vaultRoutes from './routes/vaultRoutes';
import authRoutes from './routes/authRoutes';
import listRoutes from './routes/listRoutes';
import rateLimit from 'express-rate-limit';
import { checkEnvVariables } from './utils/envChecks';
import AuthController from './controllers/authController';
import VaultController from './controllers/vaultController';
import ListController from './controllers/listController';
import authMiddleware from './middleware/authMiddleware';
import logger from './utils/logger';

const app = express();
const port = process.env.PORT || 3000;

/*
// Middleware to log incoming requests
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});
*/

const config = checkEnvVariables();

const authController = new AuthController(config);
const vaultController = new VaultController(config);
const listController = new ListController(config);
const authMiddlewareInstance = authMiddleware(config);

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});

app.use(limiter);
app.use(express.json());
app.use(express.static('public'));

//app.use('/', landingRoutes);

app.get('/foo', (req: express.Request, res: express.Response) => {
    res.send('<html><body><h1>Hello, World!</h1></body></html>');
});

app.use('/auth', authRoutes(authController, express.Router()));
app.use('/', listRoutes(authMiddlewareInstance, listController, express.Router()));
app.use('/', vaultRoutes(authMiddlewareInstance, vaultController, express.Router()));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});

export default app;
