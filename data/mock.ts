import { Repo, AISummary, SuggestedTest, Run, AIExplain, HistoryItem } from '../types';

interface MockData {
  repo: Repo;
  aiSummary: AISummary;
  suggestedTests: SuggestedTest[];
  run: Run;
  aiExplain: AIExplain[];
  history: HistoryItem[];
}

export const mockData: MockData = {
  repo: {
    url: "https://github.com/user/repo",
    files: ["src/auth.ts", "src/user.ts", "src/utils.ts", "package.json", "README.md", "src/db.ts", "src/middleware/auth.ts"],
    detectedTech: ["Node.js", "Express", "Jest", "TypeScript"]
  },
  aiSummary: {
    overview: "A web service with JWT-based authentication and user profile management.",
    risks: ["Unvalidated Inputs", "Error Handling Gaps", "Missing Rate Limiting"]
  },
  suggestedTests: [
    {"id":1,"name":"Login with valid credentials","function":"login","type":"unit","complexity":"S","selected":false},
    {"id":2,"name":"Login with invalid password","function":"login","type":"negative","complexity":"S","selected":false},
    {"id":3,"name":"Register new user with valid data","function":"register","type":"unit","complexity":"M","selected":false},
    {"id":4,"name":"Register user with existing email","function":"register","type":"negative","complexity":"M","selected":false},
    {"id":5,"name":"Profile update success","function":"updateProfile","type":"integration","complexity":"M","selected":false},
    {"id":6,"name":"Profile update with invalid email","function":"updateProfile","type":"negative","complexity":"S","selected":false},
    {"id":7,"name":"Access protected route without JWT","function":"authGuard","type":"negative","complexity":"S","selected":false},
    {"id":8,"name":"Access protected route with expired JWT","function":"authGuard","type":"edge","complexity":"S","selected":false},
    {"id":9,"name":"User listing pagination works correctly","function":"listUsers","type":"integration","complexity":"M","selected":false},
    {"id":10,"name":"Database connection error is handled gracefully","function":"db","type":"edge","complexity":"L","selected":false}
  ],
  run: {
    total: 3,
    passed: 2,
    failed: 1,
    durationMs: 5420,
    results: [
      {
        id: 1,
        name: 'Login with valid credentials',
        status: 'pass',
        timeMs: 1471,
        log: "[INFO] Starting test: develop - Test Case 3\n[INFO] Initializing test environment\n[SUCCESS] Test passed successfully\n[INFO] Cleanup completed",
        branch: 'main',
        author: 'an@gmail.com',
        executedAt: '11/1/2025, 6:27:18 PM'
      },
      {
        id: 2,
        name: 'Login with invalid password',
        status: 'fail',
        timeMs: 1903,
        error: "Assertion failed: Expected true, got false",
        log: "[INFO] Starting test: develop - Test Case 1\n[INFO] Initializing test environment\n[ERROR] Expected value to be true, but got false\n[ERROR] Test failed at line 42",
        branch: 'main',
        author: 'an@gmail.com',
        executedAt: '11/1/2025, 6:27:20 PM',
        aiSuggestion: {
            name: "Login with invalid password",
            cause: "The test is failing because the expected condition is not met. Consider:",
            suggestion: "1. Checking if the input data is correctly formatted\n2. Verifying the authentication token is valid\n3. Ensuring the database connection is established",
            severity: "medium"
        }
      },
      {
        id: 3,
        name: 'Register new user with valid data',
        status: 'pass',
        timeMs: 640,
        log: "[INFO] Starting test: develop - Test Case 2\n[INFO] Initializing test environment\n[SUCCESS] Test passed successfully\n[INFO] Cleanup completed",
        branch: 'main',
        author: 'an@gmail.com',
        executedAt: '11/1/2025, 6:27:21 PM'
      }
    ]
  },
  aiExplain: [
    {"name":"Login with invalid password","cause":"The login function throws an unhandled exception when a user is not found, resulting in a 500 Internal Server Error instead of a 401 Unauthorized.","suggestion":"Wrap the user lookup in a try/catch block. If the user is not found or password does not match, return a 401 status code explicitly.","severity":"medium"}
  ],
  history: [
    {"runId":"#1042","tests":8,"pass":7,"fail":1,"duration":"4.1s","date":"2025-11-01 13:05"},
    {"runId":"#1041","tests":10,"pass":9,"fail":1,"duration":"5.0s","date":"2025-10-31 18:22"},
    {"runId":"#1040","tests":10,"pass":10,"fail":0,"duration":"3.8s","date":"2025-10-31 10:15"},
    {"runId":"#1039","tests":5,"pass":5,"fail":0,"duration":"2.1s","date":"2025-10-30 09:00"},
    {"runId":"#1038","tests":8,"pass":6,"fail":2,"duration":"4.5s","date":"2025-10-29 16:45"}
  ]
};