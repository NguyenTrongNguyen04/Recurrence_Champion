import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { GeminiService } from '../services/gemini.service.js';
import { CodeParserService } from '../services/codeParser.service.js';
import { DatabaseService } from '../services/database.service.js';
import { AnalysisRequest } from '../types/index.js';

const router = express.Router();
const upload = multer({
  dest: './uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export function createAnalysisRoutes(
  geminiService: GeminiService,
  codeParser: CodeParserService,
  db: DatabaseService
) {
  /**
   * POST /api/analysis/analyze
   * Phân tích code và sinh test cases
   */
  router.post('/analyze', upload.array('files', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { codeSnippet, githubUrl, language } = req.body;

      if (!files?.length && !codeSnippet && !githubUrl) {
        return res.status(400).json({
          error: 'Please provide files, code snippet, or GitHub URL',
        });
      }

      const parsedFiles: Array<{ content: string; name: string; language: string }> = [];

      // Process uploaded files
      if (files && files.length > 0) {
        for (const file of files) {
          const validation = codeParser.validateFile(file.originalname, file.size);
          if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
          }

          // Đọc nội dung file từ file.path (multer lưu file vào disk)
          let fileContent: string;
          try {
            // Nếu file có buffer (memory storage), dùng buffer
            if (file.buffer) {
              fileContent = file.buffer.toString('utf-8');
            } else {
              // Nếu file được lưu vào disk (disk storage), đọc từ path
              fileContent = fs.readFileSync(file.path, 'utf-8');
              // Xóa file tạm sau khi đọc
              fs.unlinkSync(file.path);
            }
          } catch (readError: any) {
            console.error(`[Analysis] Error reading file ${file.originalname}:`, readError);
            return res.status(500).json({
              error: `Failed to read file ${file.originalname}: ${readError.message}`,
            });
          }

          const parsed = codeParser.parseFile(file.originalname, fileContent);
          parsedFiles.push({
            content: parsed.content,
            name: parsed.name,
            language: parsed.language,
          });
        }
      }

      // Process code snippet
      if (codeSnippet) {
        const snippetLanguage = language || 'javascript';
        parsedFiles.push({
          content: codeSnippet,
          name: `snippet.${snippetLanguage}`,
          language: snippetLanguage,
        });
      }

      // TODO: Process GitHub URL (implement later)
      if (githubUrl) {
        return res.status(501).json({
          error: 'GitHub URL analysis not yet implemented',
        });
      }

      if (parsedFiles.length === 0) {
        return res.status(400).json({
          error: 'No valid code to analyze',
        });
      }

      // Analyze with Gemini
      console.log(`[Analysis] ========== START analyzeMultipleFiles ==========`);
      console.log(`[Analysis] Parsed files count: ${parsedFiles.length}`);
      for (let i = 0; i < parsedFiles.length; i++) {
        const f = parsedFiles[i];
        console.log(`[Analysis] File ${i + 1}: ${f.name}, language: ${f.language}, content length: ${f.content.length}`);
        console.log(`[Analysis] File ${i + 1} content preview: ${f.content.substring(0, 200)}...`);
      }
      
      const result = await geminiService.analyzeMultipleFiles(parsedFiles);
      
      console.log(`[Analysis] Gemini analysis complete`);
      console.log(`[Analysis] Result suggestedTests count: ${result.suggestedTests?.length || 0}`);
      console.log(`[Analysis] Result aiSummary risks count: ${result.aiSummary?.risks?.length || 0}`);

      // Detect technology
      const allFiles = parsedFiles.map(f => ({
        content: f.content,
        name: f.name,
        language: f.language,
        extension: codeParser.getExtension(f.name),
      }));
      const detectedTech = codeParser.detectTechnology(allFiles);

      // Merge detected tech
      result.repo.detectedTech = [...new Set([...result.repo.detectedTech, ...detectedTech])];

      // Merge source code từ tất cả files hoặc code snippet
      let combinedSourceCode = '';
      if (files && files.length > 0) {
        combinedSourceCode = parsedFiles.map(f => 
          `// File: ${f.name}\n${f.content}`
        ).join('\n\n');
      } else if (codeSnippet) {
        combinedSourceCode = codeSnippet;
      }

      console.log(`[Analysis] Combined source code length: ${combinedSourceCode.length}`);
      console.log(`[Analysis] Creating analysis session...`);

      // Create analysis session và save to database
      const sessionId = db.createAnalysisSession(
        githubUrl, 
        result.repo.files, 
        result.repo.detectedTech,
        combinedSourceCode
      );
      
      console.log(`[Analysis] Session created: ${sessionId}`);
      console.log(`[Analysis] Saving ${result.suggestedTests?.length || 0} test cases to database...`);
      
      db.saveTestCases(sessionId, result.suggestedTests || []);
      
      console.log(`[Analysis] Test cases saved to database`);
      console.log(`[Analysis] ========== END analyzeMultipleFiles ==========`);

      res.json({
        sessionId,
        ...result,
      });
    } catch (error: any) {
      console.error('[Analysis] Error:', error);
      res.status(500).json({
        error: 'Failed to analyze code',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/analysis/session/:sessionId
   * Lấy kết quả phân tích theo session ID
   */
  router.get('/session/:sessionId', (req, res) => {
    try {
      const { sessionId } = req.params;
      console.log(`[Analysis] GET /session/${sessionId} - Request received`);
      
      const session = db.getAnalysisSession(sessionId);

      if (!session) {
        console.error(`[Analysis] Session not found: ${sessionId}`);
        return res.status(404).json({ error: 'Session not found' });
      }

      console.log(`[Analysis] Session found, getting test cases...`);
      const testCases = db.getTestCases(sessionId);
      console.log(`[Analysis] Test cases from database: ${testCases.length}`);

      // Build AI Summary from risks (stored in session or need to reconstruct)
      // For now, return basic structure - can be enhanced later
      const aiSummary = {
        overview: 'Analysis complete',
        risks: [],
        detectedFunctions: [],
        detectedClasses: [],
      };

      const response = {
        sessionId,
        repo: {
          url: session.repo_url,
          files: JSON.parse(session.files || '[]'),
          detectedTech: JSON.parse(session.detected_tech || '[]'),
        },
        suggestedTests: testCases, // Map testCases to suggestedTests for frontend compatibility
        aiSummary,
      };

      console.log(`[Analysis] Response prepared:`);
      console.log(`[Analysis] - Session ID: ${response.sessionId}`);
      console.log(`[Analysis] - Suggested tests count: ${response.suggestedTests.length}`);
      console.log(`[Analysis] - Files: ${response.repo.files.length}`);
      
      res.json(response);
    } catch (error: any) {
      console.error('[Analysis] Error getting session:', error);
      console.error('[Analysis] Error stack:', error.stack);
      res.status(500).json({
        error: 'Failed to get analysis session',
        message: error.message,
      });
    }
  });

  /**
   * PUT /api/analysis/test-case/:testCaseId
   * Update test case (selection, edits)
   */
  router.put('/test-case/:testCaseId', (req, res) => {
    try {
      const { testCaseId } = req.params;
      const updates = req.body;

      db.updateTestCase(testCaseId, updates);

      if (updates.selected !== undefined) {
        db.updateTestCaseSelection(testCaseId, updates.selected);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('[Analysis] Error:', error);
      res.status(500).json({
        error: 'Failed to update test case',
        message: error.message,
      });
    }
  });

  /**
   * PUT /api/analysis/test-cases/batch
   * Update multiple test cases (for select all/clear)
   */
  router.put('/test-cases/batch', (req, res) => {
    try {
      const { testCaseIds, selected } = req.body;

      if (!Array.isArray(testCaseIds)) {
        return res.status(400).json({ error: 'testCaseIds must be an array' });
      }

      for (const testCaseId of testCaseIds) {
        db.updateTestCaseSelection(testCaseId, selected === true);
      }

      res.json({ success: true, updated: testCaseIds.length });
    } catch (error: any) {
      console.error('[Analysis] Error:', error);
      res.status(500).json({
        error: 'Failed to update test cases',
        message: error.message,
      });
    }
  });

  return router;
}

