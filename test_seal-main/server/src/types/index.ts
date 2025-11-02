export interface Repo {
  url?: string;
  files: string[];
  detectedTech: string[];
}

export interface AISummary {
  overview: string;
  risks: string[];
  detectedFunctions: string[];
  detectedClasses: string[];
}

export interface TestStep {
  step: number;
  description: string;
  action: string;
}

export interface SuggestedTest {
  id: string;
  name: string;
  function: string;
  code?: string;
  type: 'unit' | 'integration' | 'negative' | 'edge';
  complexity: 'S' | 'M' | 'L';
  selected: boolean;
  description: string;
  steps: TestStep[];
  inputConditions: string[];
  expectedResults: string;
  testScope: 'main' | 'sub' | 'edge';
  priority: 'high' | 'medium' | 'low';
}

export interface RunResult {
  id: string;
  testId: string;
  name: string;
  status: 'pending' | 'running' | 'pass' | 'fail' | 'skipped';
  timeMs: number | null;
  error?: string;
  log: string;
  branch?: string;
  author?: string;
  executedAt?: string;
  aiSuggestion?: AIExplain;
}

export interface Run {
  id: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  results: RunResult[];
  createdAt: string;
  branch?: string;
  author?: string;
}

export interface AIExplain {
  name: string;
  cause: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
}

export interface HistoryItem {
  runId: string;
  tests: number;
  pass: number;
  fail: number;
  skip: number;
  duration: string;
  date: string;
  branch?: string;
}

export interface AnalysisRequest {
  files?: File[];
  codeSnippet?: string;
  githubUrl?: string;
  language?: string;
}

export interface AnalysisResponse {
  repo: Repo;
  aiSummary: AISummary;
  suggestedTests: SuggestedTest[];
}

