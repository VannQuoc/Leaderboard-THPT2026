import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'node:path';
import { config } from './config.js';
import studentsRouter from './routes/students.js';
import statsRouter from './routes/stats.js';
import lookupRouter from './routes/lookup.js';
import exportRouter from './routes/export.js';

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());

// API routes
app.use('/api/students', studentsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/lookup', lookupRouter);
app.use('/api/export', exportRouter);

// Serve client static files in production
app.use(express.static(config.clientDir));
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(config.clientDir, 'index.html'));
});

export default app;
