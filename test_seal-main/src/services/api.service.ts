/**
 * Frontend API service để gọi backend APIs
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface AnalysisResponse {
  sessionId: string;
  repo: {
    url?: string;
    files: string[];
    detectedTech: string[];
  };
  aiSummary: {
    overview: string;
    risks: string[];
    detectedFunctions: string[];
    detectedClasses: string[];
  };
  suggestedTests: Array<{
    id: string;
    name: string;
    function: string;
    type: 'unit' | 'integration' | 'negative' | 'edge';
    complexity: 'S' | 'M' | 'L';
    selected: boolean;
    description: string;
    steps: Array<{ step: number; description: string; action: string }>;
    inputConditions: string[];
    expectedResults: string;
    testScope: 'main' | 'sub' | 'edge';
    priority: 'high' | 'medium' | 'low';
  }>;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Upload files và phân tích code
   */
  async analyzeFiles(files: File[]): Promise<AnalysisResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/analysis/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Phân tích code snippet
   */
  async analyzeSnippet(codeSnippet: string, language: string = 'javascript'): Promise<AnalysisResponse> {
    return this.request<AnalysisResponse>('/analysis/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        codeSnippet,
        language,
      }),
    });
  }

  /**
   * Lấy kết quả phân tích theo session ID
   */
  async getAnalysisSession(sessionId: string): Promise<AnalysisResponse> {
    return this.request<AnalysisResponse>(`/analysis/session/${sessionId}`);
  }

  /**
   * Update test case (selection, edits)
   */
  async updateTestCase(testCaseId: string, updates: any): Promise<void> {
    return this.request<void>(`/analysis/test-case/${testCaseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Update multiple test cases (batch)
   */
  async updateTestCasesBatch(testCaseIds: string[], selected: boolean): Promise<void> {
    return this.request<void>('/analysis/test-cases/batch', {
      method: 'PUT',
      body: JSON.stringify({ testCaseIds, selected }),
    });
  }

  /**
   * Chạy test cases đã chọn
   */
  async runTests(sessionId: string, testCaseIds: string[], branch?: string, author?: string): Promise<{
    runId: string;
    status: string;
    total: number;
  }> {
    return this.request<{ runId: string; status: string; total: number }>('/execution/run', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        testCaseIds,
        branch,
        author,
      }),
    });
  }

  /**
   * Lấy status và results của test run
   */
  async getTestRun(runId: string): Promise<{
    id: string;
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    durationMs: number;
    results: any[];
    createdAt: string;
    branch?: string;
    author?: string;
  }> {
    return this.request<any>(`/execution/run/${runId}`);
  }

  /**
   * Lấy lịch sử test runs
   */
  async getHistory(limit: number = 50): Promise<Array<{
    runId: string;
    tests: number;
    pass: number;
    fail: number;
    skip: number;
    duration: string;
    date: string;
    branch?: string;
  }>> {
    return this.request<any[]>(`/execution/history?limit=${limit}`);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiService = new ApiService();

