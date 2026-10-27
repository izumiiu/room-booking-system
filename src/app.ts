import './config/loadEnv.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { corsOptions } from './config/corsOptions.js';
import { logger } from './middlewares/logEvents.js';
import cookieParser from 'cookie-parser';
import ensureBody from './middlewares/ensureBody.js';
import registerRouter from './routes/register.js'
import loginRouter from './routes/auth.js';
import refreshRouter from './routes/refresh.js';
import logoutRouter from './routes/logout.js';

const app = express();

app.use(helmet());
 
app.use(cors(corsOptions))

app.use(express.urlencoded({ extended: false }));

app.use(express.json());
app.use(ensureBody);

app.use(cookieParser());

app.use(logger);

app.use('/register', registerRouter);
app.use('/auth', loginRouter);
app.use('/refresh', refreshRouter);
app.use('/logoutRouter', logoutRouter);

export default app;