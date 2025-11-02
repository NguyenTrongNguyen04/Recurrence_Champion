import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRoutes } from './routes/index.js';
import { GeminiService } from './services/gemini.service.js';
import { CodeParserService } from './services/codeParser.service.js';
import { DatabaseService } from './services/database.service.js';
import fs from 'fs';

// ES modules __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Ensure directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const dataDir = path.join(__dirname, '../data');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize services
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error('ERROR: GEMINI_API_KEY is not set in environment variables');
  console.error('Please create a .env file with GEMINI_API_KEY=your_key');
  process.exit(1);
}

const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
const dbPath = process.env.DB_PATH || path.join(dataDir, 'teststudio.db');

console.log('[Server] Initializing services...');
const geminiService = new GeminiService(geminiApiKey, geminiModel);
const codeParser = new CodeParserService();
const db = new DatabaseService(dbPath);

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api', createRoutes(geminiService, codeParser, db));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server] Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] ✅ TestStudio Backend Server running on port ${PORT}`);
  console.log(`[Server] Environment: ${NODE_ENV}`);
  console.log(`[Server] Gemini Model: ${geminiModel}`);
  console.log(`[Server] Database: ${dbPath}`);
  console.log(`[Server] API: http://localhost:${PORT}/api`);
  console.log(`[Server] Health Check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, closing database...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, closing database...');
  db.close();
  process.exit(0);
});

