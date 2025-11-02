import express from 'express';
import { createAnalysisRoutes } from './analysis.routes.js';
import { createExecutionRoutes } from './execution.routes.js';
import { GeminiService } from '../services/gemini.service.js';
import { CodeParserService } from '../services/codeParser.service.js';
import { DatabaseService } from '../services/database.service.js';

export function createRoutes(
  geminiService: GeminiService,
  codeParser: CodeParserService,
  db: DatabaseService
) {
  const router = express.Router();

  router.use('/analysis', createAnalysisRoutes(geminiService, codeParser, db));
  router.use('/execution', createExecutionRoutes(db, geminiService));

  // Health check
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

