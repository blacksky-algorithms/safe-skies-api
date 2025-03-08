import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
// import { router } from './routes';

const app = express();

// Security middleware
app.use(helmet());
app.disable('x-powered-by');

// Request logging
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
import rateLimit from 'express-rate-limit';
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
  })
);

// Routes
// app.use('/api', router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(config.PORT, () => {
  console.log(
    `Server running in ${config.NODE_ENV} mode on port ${config.PORT}`
  );
});
