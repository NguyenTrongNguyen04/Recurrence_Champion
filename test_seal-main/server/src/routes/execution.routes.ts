import express from 'express';
import { DatabaseService } from '../services/database.service.js';
import { GeminiService } from '../services/gemini.service.js';
import { TestExecutorService } from '../services/testExecutor.service.js';
import { RunResult } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export function createExecutionRoutes(
  db: DatabaseService,
  geminiService: GeminiService
) {
  const testExecutor = new TestExecutorService();
  const router = express.Router();

  /**
   * POST /api/execution/run
   * Chạy test cases đã chọn
   */
  router.post('/run', async (req, res) => {
    try {
      console.log('[Execution] POST /run - Request received');
      const { sessionId, testCaseIds, branch, author } = req.body;

      if (!sessionId || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
        console.error('[Execution] Validation error: sessionId or testCaseIds missing');
        return res.status(400).json({
          error: 'sessionId and testCaseIds are required',
        });
      }

      console.log(`[Execution] Running ${testCaseIds.length} test cases for session ${sessionId}`);

      // Get selected test cases
      const allTestCases = db.getTestCases(sessionId);
      const selectedTests = allTestCases.filter(tc => testCaseIds.includes(tc.id));

      if (selectedTests.length === 0) {
        console.error('[Execution] No test cases found');
        return res.status(400).json({
          error: 'No test cases found to run',
        });
      }

      console.log(`[Execution] Found ${selectedTests.length} test cases to execute`);

      // Get source code from session
      const sourceCode = db.getSourceCode(sessionId);
      if (!sourceCode) {
        console.error(`[Execution] Source code not found for session ${sessionId}`);
        return res.status(400).json({
          error: 'Source code not found for this session',
        });
      }

      console.log(`[Execution] Source code retrieved (${sourceCode.length} chars)`);

      // Create test run
      const runId = db.createTestRun(sessionId, branch, author);
      db.updateTestRun(runId, { total: selectedTests.length });

      console.log(`[Execution] Created test run ${runId}`);

      // Start execution (async - send response immediately)
      executeTestsAsync(runId, selectedTests, sourceCode, db, geminiService, testExecutor).catch((err) => {
        console.error('[Execution] Async execution error:', err);
      });

      console.log(`[Execution] Started async execution for run ${runId}`);

      res.json({
        runId,
        status: 'running',
        total: selectedTests.length,
      });
    } catch (error: any) {
      console.error('[Execution] POST /run - Error:', error);
      console.error('[Execution] Error stack:', error.stack);
      res.status(500).json({
        error: 'Failed to start test execution',
        message: error.message || 'Unknown error',
      });
    }
  });

  /**
   * GET /api/execution/run/:runId
   * Lấy status và results của test run
   */
  router.get('/run/:runId', (req, res) => {
    try {
      const { runId } = req.params;
      const run = db.getTestRun(runId);

      if (!run) {
        return res.status(404).json({ error: 'Test run not found' });
      }

      res.json(run);
    } catch (error: any) {
      console.error('[Execution] Error:', error);
      res.status(500).json({
        error: 'Failed to get test run',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/execution/history
   * Lấy lịch sử test runs
   */
  router.get('/history', (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const history = db.getHistory(limit);

      res.json(history);
    } catch (error: any) {
      console.error('[Execution] Error:', error);
      res.status(500).json({
        error: 'Failed to get history',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/execution/test-case/:testCaseId
   * Lấy test case code
   */
  router.get('/test-case/:testCaseId', (req, res) => {
    try {
      const { testCaseId } = req.params;
      const { sessionId } = req.query;

      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      const testCases = db.getTestCases(sessionId as string);
      const testCase = testCases.find(tc => tc.id === testCaseId);

      if (!testCase) {
        return res.status(404).json({ error: 'Test case not found' });
      }

      res.json({ code: testCase.code || '' });
    } catch (error: any) {
      console.error('[Execution] Error:', error);
      res.status(500).json({
        error: 'Failed to get test case',
        message: error.message,
      });
    }
  });

  return router;
}

/**
 * Execute tests asynchronously
 * NOTE: Trong production, đây sẽ là một job queue hoặc worker process
 */
async function executeTestsAsync(
  runId: string,
  testCases: any[],
  sourceCode: string,
  db: DatabaseService,
  geminiService: GeminiService,
  testExecutor: TestExecutorService
) {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const startTime = Date.now();

  console.log(`[Execution] Starting async execution for ${testCases.length} test cases`);

  // Tạo initial results cho TẤT CẢ test cases ngay từ đầu
  // Để user thấy tất cả test cases đều ở trạng thái 'pending' hoặc 'running'
  const initialResults: Map<string, RunResult> = new Map();
  for (const testCase of testCases) {
    const resultId = uuidv4();
    
    const initialResult: RunResult = {
      id: resultId,
      testId: testCase.id,
      name: testCase.name,
      status: 'pending', // Bắt đầu với 'pending', sẽ chuyển sang 'running' khi bắt đầu chạy
      timeMs: null,
      log: `[INFO] Queued test: ${testCase.name}\n[INFO] Test type: ${testCase.type}\n[INFO] Target function: ${testCase.function}\n[INFO] Complexity: ${testCase.complexity}`,
      executedAt: new Date().toISOString(),
    };
    
    initialResults.set(testCase.id, initialResult);
    db.saveTestResult(initialResult, runId);
  }

  console.log(`[Execution] Created ${initialResults.size} initial results`);

  // Bây giờ mới chạy từng test case
  for (const testCase of testCases) {
    const initialResult = initialResults.get(testCase.id);
    if (!initialResult) {
      console.error(`[Execution] Initial result not found for test case ${testCase.id}`);
      continue;
    }
    
    const resultId = initialResult.id;
    
    // Update status thành 'running' khi bắt đầu chạy
    const runningResult: RunResult = {
      ...initialResult,
      status: 'running',
      log: `[INFO] Starting test: ${testCase.name}\n[INFO] Test type: ${testCase.type}\n[INFO] Target function: ${testCase.function}\n[INFO] Complexity: ${testCase.complexity}`,
    };
    db.saveTestResult(runningResult, runId);

    try {
      // Execute test thực sự
      const executionResult = await testExecutor.executeTest(
        sourceCode,
        testCase,
        'javascript' // TODO: Detect từ session
      );

      const result: RunResult = {
        id: resultId,
        testId: testCase.id,
        name: testCase.name,
        status: executionResult.status,
        timeMs: executionResult.timeMs,
        log: executionResult.log,
        error: executionResult.error,
        executedAt: new Date().toISOString(),
      };

      // Nếu fail, tạo AI explanation
      if (executionResult.status === 'fail') {
        try {
          const errorMessage = executionResult.error || 'Test assertion failed';
          const codeContext = `Source Code:\n${sourceCode}\n\nTest Code:\n${testCase.code || ''}\n\nExpected: ${testCase.expectedResults}`;
          
          const explanation = await geminiService.explainTestFailure(
            testCase.name,
            errorMessage,
            codeContext
          );
          
          result.aiSuggestion = {
            name: testCase.name,
            cause: explanation.cause,
            suggestion: explanation.suggestion,
            severity: explanation.severity,
          };
        } catch (error) {
          console.error('[Execution] Failed to get AI explanation:', error);
        }
      }

      db.saveTestResult(result, runId);

      if (executionResult.status === 'pass') {
        passed++;
      } else {
        failed++;
      }
    } catch (error: any) {
      // Handle execution errors
      console.error(`[Execution] Error executing test ${testCase.name}:`, error);
      
      const errorResult: RunResult = {
        id: resultId,
        testId: testCase.id,
        name: testCase.name,
        status: 'fail',
        timeMs: Date.now() - startTime,
        log: initialResult.log + `\n[ERROR] Test execution failed: ${error.message}`,
        error: error.message,
        executedAt: new Date().toISOString(),
      };
      
      db.saveTestResult(errorResult, runId);
      failed++;
    }

    // Update run stats after each test
    db.updateTestRun(runId, {
      passed,
      failed,
      skipped,
    });
  }

  // Final update with total duration
  const totalDuration = Date.now() - startTime;
  db.updateTestRun(runId, {
    durationMs: totalDuration,
  });

  console.log(`[Execution] Completed run ${runId}: ${passed} passed, ${failed} failed, ${skipped} skipped`);
}

