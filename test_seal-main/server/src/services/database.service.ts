import Database from 'better-sqlite3';
import { SuggestedTest, Run, RunResult, HistoryItem } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  private initDatabase() {
    // Table: analysis_sessions - Lưu các lần phân tích
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS analysis_sessions (
        id TEXT PRIMARY KEY,
        repo_url TEXT,
        files TEXT, -- JSON array
        detected_tech TEXT, -- JSON array
        source_code TEXT, -- Original source code for test execution
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Table: test_cases - Lưu test cases đã được tạo
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        name TEXT NOT NULL,
        function_name TEXT,
        code TEXT,
        type TEXT,
        complexity TEXT,
        description TEXT,
        steps TEXT, -- JSON array
        input_conditions TEXT, -- JSON array
        expected_results TEXT,
        test_scope TEXT,
        priority TEXT,
        selected INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES analysis_sessions(id)
      )
    `);

    // Migration: Thêm column code nếu chưa có (cho database cũ)
    try {
      this.db.exec(`ALTER TABLE test_cases ADD COLUMN code TEXT`);
    } catch (error: any) {
      // Column đã tồn tại, bỏ qua
      if (!error.message.includes('duplicate column name')) {
        console.warn('[Database] Migration warning:', error.message);
      }
    }

    // Table: test_runs - Lưu các lần chạy test
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_runs (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        total INTEGER DEFAULT 0,
        passed INTEGER DEFAULT 0,
        failed INTEGER DEFAULT 0,
        skipped INTEGER DEFAULT 0,
        duration_ms INTEGER DEFAULT 0,
        branch TEXT,
        author TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES analysis_sessions(id)
      )
    `);

    // Table: test_results - Lưu kết quả từng test
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_results (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        test_case_id TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'running',
        time_ms INTEGER,
        error TEXT,
        log TEXT,
        ai_suggestion TEXT, -- JSON
        executed_at TEXT,
        FOREIGN KEY (run_id) REFERENCES test_runs(id),
        FOREIGN KEY (test_case_id) REFERENCES test_cases(id)
      )
    `);

    console.log('[Database] Database initialized');
  }

  // Analysis Sessions
  createAnalysisSession(repoUrl?: string, files: string[] = [], detectedTech: string[] = [], sourceCode?: string): string {
    const id = uuidv4();
    
    // Migration: Thêm column source_code nếu chưa có
    try {
      this.db.exec(`ALTER TABLE analysis_sessions ADD COLUMN source_code TEXT`);
    } catch (error: any) {
      // Column đã tồn tại, bỏ qua
      if (!error.message.includes('duplicate column name')) {
        console.warn('[Database] Migration warning:', error.message);
      }
    }
    
    const stmt = this.db.prepare(`
      INSERT INTO analysis_sessions (id, repo_url, files, detected_tech, source_code)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, repoUrl || null, JSON.stringify(files), JSON.stringify(detectedTech), sourceCode || null);
    return id;
  }

  getAnalysisSession(sessionId: string) {
    const stmt = this.db.prepare('SELECT * FROM analysis_sessions WHERE id = ?');
    const session = stmt.get(sessionId) as any;
    return session;
  }

  getSourceCode(sessionId: string): string | null {
    const session = this.getAnalysisSession(sessionId);
    return session?.source_code || null;
  }

  // Test Cases
  saveTestCases(sessionId: string, testCases: SuggestedTest[]): void {
    console.log('[Database] ========== START saveTestCases ==========');
    console.log(`[Database] Session ID: ${sessionId}`);
    console.log(`[Database] Test cases count: ${testCases?.length || 0}`);
    
    if (!testCases || testCases.length === 0) {
      console.warn('[Database] WARNING: No test cases to save!');
      console.log('[Database] ========== END saveTestCases (empty) ==========');
      return;
    }

    const testCasesInfo = testCases.map(t => ({ name: t.name, function: t.function }));
    console.log('[Database] Test cases to save:', testCasesInfo);

    const stmt = this.db.prepare(`
      INSERT INTO test_cases (
        id, session_id, name, function_name, code, type, complexity, description,
        steps, input_conditions, expected_results, test_scope, priority, selected
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((tests: SuggestedTest[]) => {
      for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        try {
          console.log(`[Database] Saving test case ${i + 1}/${tests.length}: ${test.name}`);
          stmt.run(
            test.id,
            sessionId,
            test.name,
            test.function,
            test.code || null,
            test.type,
            test.complexity,
            test.description,
            JSON.stringify(test.steps),
            JSON.stringify(test.inputConditions),
            test.expectedResults,
            test.testScope,
            test.priority,
            test.selected ? 1 : 0
          );
          console.log(`[Database] ✓ Test case ${i + 1} saved successfully: ${test.name}`);
        } catch (error: any) {
          console.error(`[Database] ✗ Error saving test case ${i + 1}: ${test.name}`, error.message);
          throw error;
        }
      }
    });

    try {
      insertMany(testCases);
      console.log(`[Database] ✓ All ${testCases.length} test cases saved successfully`);
      console.log('[Database] ========== END saveTestCases ==========');
    } catch (error: any) {
      console.error('[Database] ✗ Error in saveTestCases transaction:', error.message);
      console.error('[Database] Error stack:', error.stack);
      throw error;
    }
  }

  getTestCases(sessionId: string): SuggestedTest[] {
    console.log(`[Database] ========== START getTestCases ==========`);
    console.log(`[Database] Session ID: ${sessionId}`);
    
    const stmt = this.db.prepare('SELECT * FROM test_cases WHERE session_id = ?');
    const rows = stmt.all(sessionId) as any[];
    
    console.log(`[Database] Raw rows from database: ${rows.length}`);
    if (rows.length > 0) {
      console.log(`[Database] First row sample:`, {
        id: rows[0].id,
        name: rows[0].name,
        function: rows[0].function_name,
        hasCode: !!rows[0].code,
      });
    }

    const testCases = rows.map((row, index) => {
      const testCase = {
        id: row.id,
        name: row.name,
        function: row.function_name,
        code: row.code || undefined,
        type: row.type as any,
        complexity: row.complexity as any,
        selected: row.selected === 1,
        description: row.description,
        steps: JSON.parse(row.steps || '[]'),
        inputConditions: JSON.parse(row.input_conditions || '[]'),
        expectedResults: row.expected_results,
        testScope: row.test_scope as any,
        priority: row.priority as any,
      };
      
      if (index < 3) {
        console.log(`[Database] Test case ${index + 1}: ${testCase.name}, function: ${testCase.function}`);
      }
      
      return testCase;
    });

    console.log(`[Database] Processed ${testCases.length} test cases`);
    console.log(`[Database] ========== END getTestCases ==========`);

    return testCases;
  }

  updateTestCaseSelection(testCaseId: string, selected: boolean): void {
    const stmt = this.db.prepare('UPDATE test_cases SET selected = ? WHERE id = ?');
    stmt.run(selected ? 1 : 0, testCaseId);
  }

  updateTestCase(testCaseId: string, updates: Partial<SuggestedTest>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.steps !== undefined) {
      fields.push('steps = ?');
      values.push(JSON.stringify(updates.steps));
    }
    if (updates.inputConditions !== undefined) {
      fields.push('input_conditions = ?');
      values.push(JSON.stringify(updates.inputConditions));
    }
    if (updates.expectedResults !== undefined) {
      fields.push('expected_results = ?');
      values.push(updates.expectedResults);
    }

    if (fields.length > 0) {
      values.push(testCaseId);
      const stmt = this.db.prepare(`UPDATE test_cases SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }
  }

  // Test Runs
  createTestRun(sessionId: string, branch?: string, author?: string): string {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO test_runs (id, session_id, branch, author)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, sessionId, branch || null, author || null);
    return id;
  }

  updateTestRun(runId: string, updates: Partial<Run>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.total !== undefined) {
      fields.push('total = ?');
      values.push(updates.total);
    }
    if (updates.passed !== undefined) {
      fields.push('passed = ?');
      values.push(updates.passed);
    }
    if (updates.failed !== undefined) {
      fields.push('failed = ?');
      values.push(updates.failed);
    }
    if (updates.skipped !== undefined) {
      fields.push('skipped = ?');
      values.push(updates.skipped);
    }
    if (updates.durationMs !== undefined) {
      fields.push('duration_ms = ?');
      values.push(updates.durationMs);
    }

    if (fields.length > 0) {
      values.push(runId);
      const stmt = this.db.prepare(`UPDATE test_runs SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }
  }

  // Test Results
  saveTestResult(result: RunResult, runId: string): void {
    // Sử dụng INSERT OR REPLACE để có thể update result khi status thay đổi
    // Điều này cho phép update status từ 'pending' -> 'running' -> 'pass'/'fail'
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO test_results (
        id, run_id, test_case_id, name, status, time_ms, error, log, ai_suggestion, executed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      result.id,
      runId,
      result.testId,
      result.name,
      result.status,
      result.timeMs,
      result.error || null,
      result.log,
      result.aiSuggestion ? JSON.stringify(result.aiSuggestion) : null,
      result.executedAt || new Date().toISOString()
    );
  }

  getTestResults(runId: string): RunResult[] {
    const stmt = this.db.prepare('SELECT * FROM test_results WHERE run_id = ?');
    const rows = stmt.all(runId) as any[];

    return rows.map(row => ({
      id: row.id,
      testId: row.test_case_id,
      name: row.name,
      status: row.status as any,
      timeMs: row.time_ms,
      error: row.error,
      log: row.log,
      executedAt: row.executed_at,
      aiSuggestion: row.ai_suggestion ? JSON.parse(row.ai_suggestion) : undefined,
    }));
  }

  getTestRun(runId: string): Run | null {
    const stmt = this.db.prepare(`
      SELECT tr.*, 
        (SELECT COUNT(*) FROM test_results WHERE run_id = tr.id) as total,
        (SELECT COUNT(*) FROM test_results WHERE run_id = tr.id AND status = 'pass') as passed,
        (SELECT COUNT(*) FROM test_results WHERE run_id = tr.id AND status = 'fail') as failed,
        (SELECT COUNT(*) FROM test_results WHERE run_id = tr.id AND status = 'skipped') as skipped
      FROM test_runs tr
      WHERE tr.id = ?
    `);
    const row = stmt.get(runId) as any;

    if (!row) return null;

    const results = this.getTestResults(runId);
    const duration = results.reduce((sum, r) => sum + (r.timeMs || 0), 0);

    return {
      id: row.id,
      total: row.total || results.length,
      passed: row.passed || 0,
      failed: row.failed || 0,
      skipped: row.skipped || 0,
      durationMs: duration,
      results,
      createdAt: row.created_at,
      branch: row.branch,
      author: row.author,
    };
  }

  // History
  getHistory(limit: number = 50): HistoryItem[] {
    const stmt = this.db.prepare(`
      SELECT 
        tr.id as runId,
        COUNT(trr.id) as tests,
        SUM(CASE WHEN trr.status = 'pass' THEN 1 ELSE 0 END) as pass,
        SUM(CASE WHEN trr.status = 'fail' THEN 1 ELSE 0 END) as fail,
        SUM(CASE WHEN trr.status = 'skipped' THEN 1 ELSE 0 END) as skip,
        SUM(trr.time_ms) as duration_ms,
        tr.created_at as date,
        tr.branch
      FROM test_runs tr
      LEFT JOIN test_results trr ON tr.id = trr.run_id
      GROUP BY tr.id
      ORDER BY tr.created_at DESC
      LIMIT ?
    `);
    const rows = stmt.all(limit) as any[];

    return rows.map(row => ({
      runId: `#${row.runId.substring(0, 4)}`,
      tests: row.tests || 0,
      pass: row.pass || 0,
      fail: row.fail || 0,
      skip: row.skip || 0,
      duration: row.duration_ms ? `${(row.duration_ms / 1000).toFixed(1)}s` : '0s',
      date: row.date ? new Date(row.date).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(',', '') : '',
      branch: row.branch,
    }));
  }

  close() {
    this.db.close();
  }
}

