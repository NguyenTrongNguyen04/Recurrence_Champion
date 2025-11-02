export interface Repo {
  url: string;
  files: string[];
  detectedTech: string[];
}

export interface AISummary {
  overview: string;
  risks: string[];
}

export interface SuggestedTest {
  id: number;
  name: string;
  function: string;
  type: 'unit' | 'integration' | 'negative' | 'edge';
  complexity: 'S' | 'M' | 'L';
  selected: boolean;
}

export interface RunResult {
  id: number;
  name: string;
  status: 'running' | 'pass' | 'fail';
  timeMs: number | null;
  error?: string;
  log: string;
  branch?: string;
  author?: string;
  executedAt?: string;
  aiSuggestion?: AIExplain;
}

export interface Run {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: RunResult[];
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
  duration: string;
  date: string;
}

// Requirement Analysis Types
export interface RequirementDocument {
  id: string;
  fileName: string;
  fileType: 'docx' | 'pdf' | 'md' | 'txt';
  uploadedAt: string;
  content: string;
  size: number;
}

export interface FunctionalRequirement {
  id: string;
  title: string;
  description: string;
  clarityScore: number; // 0-100
  testabilityScore: number; // 0-100
  conflicts: string[]; // IDs of conflicting requirements
  suggestions: string[];
  category?: string;
}

export interface NonFunctionalRequirement {
  id: string;
  title: string;
  description: string;
  type: 'performance' | 'security' | 'usability' | 'reliability' | 'scalability' | 'maintainability' | 'other';
  clarityScore: number; // 0-100
  testabilityScore: number; // 0-100
  conflicts: string[]; // IDs of conflicting requirements
  suggestions: string[];
  metrics?: string; // KPI cụ thể nếu có
}

export interface ConflictDetection {
  id: string;
  requirementIds: string[]; // IDs of conflicting requirements
  type: 'contradiction' | 'overlap' | 'dependency' | 'ambiguity';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

export interface TestabilityScore {
  requirementId: string;
  score: number; // 0-100
  criteria: {
    clarity: number; // Rõ ràng, dễ hiểu
    measurability: number; // Có thể đo lường được
    specificInputOutput: number; // Input/output cụ thể
    testableConditions: number; // Điều kiện test được
  };
  reasoning: string;
}

export interface RequirementAnalysis {
  documentId: string;
  analyzedAt: string;
  summary: {
    totalRequirements: number;
    functionalCount: number;
    nonFunctionalCount: number;
    conflictsCount: number;
    avgClarityScore: number;
    avgTestabilityScore: number;
  };
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
  conflicts: ConflictDetection[];
  testabilityScores: TestabilityScore[];
}

export interface TestCaseSuggestion {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  given: string;
  when: string;
  then: string;
  priority: 'low' | 'medium' | 'high';
  type: 'happy_path' | 'edge_case' | 'error_handling' | 'integration';
}