/**
 * API Configuration
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/health`,
  ANALYZE_GITHUB: `${API_BASE_URL}/api/analyze-github`,
  ANALYZE_CODE: `${API_BASE_URL}/api/analyze-code`,
  ANALYZE_FILES: `${API_BASE_URL}/api/analyze-files`,
  ANALYZE: `${API_BASE_URL}/api/analyze`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  DASHBOARD: `${API_BASE_URL}/api/dashboard`,
  ANALYZE_ERRORS: `${API_BASE_URL}/api/analyze-errors`,
  EXECUTE_TESTS: `${API_BASE_URL}/api/execute-tests`,
};

