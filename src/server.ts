import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import sessionMiddleware from './config/session';

import authRouter from './routes/auth';
import clientMetadataRouter from './routes/clientMetadata';
import feedsRouter from './routes/feeds';
import devRouter from './routes/dev';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);

app.use('/auth', authRouter);
app.use('/oauth', clientMetadataRouter);
app.use('/feeds', feedsRouter);
if (process.env.NODE_ENV === 'development') {
  app.use('/dev', devRouter);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
