import express from 'express';
import landingRoutes from './routes/landingRoutes';
import vaultRoutes from './routes/vaultRoutes';
import authRoutes from './routes/authRoutes';
import rateLimit from 'express-rate-limit';
import { checkEnvVariables } from './utils/envChecks';
import AuthController from './controllers/authController';
import VaultController from './controllers/vaultController';
import authMiddleware from './middleware/authMiddleware';

const app = express();
const port = process.env.PORT || 3000;

const config = checkEnvVariables();

const authController = new AuthController(config);
const vaultController = new VaultController(config);
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
app.use('/auth', authRoutes(authController, express.Router()));
app.use('/api', vaultRoutes(authMiddleware, vaultController, express.Router()));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;
