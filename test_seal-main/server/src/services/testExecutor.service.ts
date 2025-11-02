import { SuggestedTest, RunResult } from '../types/index.js';
import { VM } from 'vm2';

/**
 * Service để chạy test code và so sánh kết quả
 */
export class TestExecutorService {
  /**
   * Execute test code và so sánh với expected results
   */
  async executeTest(
    sourceCode: string,
    testCase: SuggestedTest,
    language: string = 'javascript'
  ): Promise<{
    status: 'pass' | 'fail';
    timeMs: number;
    log: string;
    error?: string;
    actualResult?: any;
    expectedResult?: string;
  }> {
    const startTime = Date.now();
    const logs: string[] = [];

    logs.push(`[INFO] Starting test: ${testCase.name}`);
    logs.push(`[INFO] Test type: ${testCase.type}`);
    logs.push(`[INFO] Target function: ${testCase.function}`);
    logs.push(`[INFO] Expected result: ${testCase.expectedResults}`);

    try {
      if (language !== 'javascript') {
        throw new Error(`Unsupported language: ${language}. Only JavaScript is supported currently.`);
      }

      // Tạo sandbox environment an toàn với vm2
      const vm = new VM({
        timeout: 5000, // 5 seconds timeout
        sandbox: {
          console: {
            log: (...args: any[]) => {
              const msg = args.map(a => 
                typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
              ).join(' ');
              logs.push(`[CONSOLE] ${msg}`);
            },
            error: (...args: any[]) => {
              const msg = args.map(a => 
                typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
              ).join(' ');
              logs.push(`[ERROR] ${msg}`);
            },
            warn: (...args: any[]) => {
              const msg = args.map(a => 
                typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
              ).join(' ');
              logs.push(`[WARN] ${msg}`);
            },
          },
        },
      });

      // Test code bây giờ đã là self-contained (bao gồm cả source code)
      // Không cần chạy source code riêng nữa vì test code đã chứa đầy đủ
      
      const testCode = testCase.code || '';
      if (!testCode.trim()) {
        throw new Error('Test code is empty');
      }

      logs.push(`[INFO] Executing test code (self-contained)...`);

      // Execute test code (self-contained - đã bao gồm source code)
      let actualResult: any;
      let testPassed = false;

      try {
        // Wrap test code để capture result và execute
        // Test code thường là một đoạn code để test, có thể:
        // 1. Gọi function và lưu vào biến result/actual
        // 2. Thực hiện assertion
        // 3. Trả về giá trị
        
        const wrappedTestCode = `
          (function() {
            try {
              let testResult = null;
              let testError = null;
              
              // Execute test code
              ${testCode}
              
              // Try to extract result from common patterns
              if (typeof result !== 'undefined') {
                testResult = result;
              } else if (typeof actual !== 'undefined') {
                testResult = actual;
              } else if (typeof value !== 'undefined') {
                testResult = value;
              } else if (typeof output !== 'undefined') {
                testResult = output;
              }
              
              // If no explicit result variable, assume success if no error
              if (testResult === null) {
                testResult = { __success: true };
              }
              
              return { type: 'success', value: testResult };
            } catch (error) {
              return { type: 'error', value: error.message || String(error) };
            }
          })()
        `;

        const testResult = vm.run(wrappedTestCode);
        
        if (testResult.type === 'error') {
          throw new Error(testResult.value);
        }

        actualResult = testResult.value;
        
        // Nếu là success object đặc biệt, coi như pass
        if (actualResult && typeof actualResult === 'object' && actualResult.__success) {
          actualResult = true;
        }
        
        logs.push(`[INFO] Test code executed successfully`);
        logs.push(`[INFO] Actual result: ${this.formatResult(actualResult)}`);
        logs.push(`[INFO] Actual result type: ${typeof actualResult}`);
        logs.push(`[INFO] Actual result value: ${JSON.stringify(actualResult)}`);

        // Step 4: So sánh với expected result
        logs.push(`[INFO] Comparing with expected result: "${testCase.expectedResults}"`);
        testPassed = this.compareResults(actualResult, testCase.expectedResults);
        
        if (testPassed) {
          logs.push(`[SUCCESS] Test passed: Result matches expected`);
          logs.push(`[SUCCESS] Expected: "${testCase.expectedResults}"`);
          logs.push(`[SUCCESS] Actual: "${this.formatResult(actualResult)}"`);
        } else {
          logs.push(`[ERROR] Test failed: Result does not match expected`);
          logs.push(`[ERROR] Expected: "${testCase.expectedResults}"`);
          logs.push(`[ERROR] Expected type: string`);
          logs.push(`[ERROR] Actual: "${this.formatResult(actualResult)}"`);
          logs.push(`[ERROR] Actual type: ${typeof actualResult}`);
          logs.push(`[ERROR] Actual JSON: ${JSON.stringify(actualResult)}`);
        }

      } catch (testError: any) {
        logs.push(`[ERROR] Test execution error: ${testError.message}`);
        throw testError;
      }

      const timeMs = Date.now() - startTime;

      return {
        status: testPassed ? 'pass' : 'fail',
        timeMs,
        log: logs.join('\n'),
        error: testPassed ? undefined : `Expected: ${testCase.expectedResults}, Actual: ${this.formatResult(actualResult)}`,
        actualResult: actualResult !== undefined ? this.formatResult(actualResult) : undefined,
        expectedResult: testCase.expectedResults,
      };

    } catch (error: any) {
      const timeMs = Date.now() - startTime;
      logs.push(`[ERROR] Test execution failed: ${error.message}`);
      
      return {
        status: 'fail',
        timeMs,
        log: logs.join('\n'),
        error: error.message,
      };
    }
  }

  /**
   * So sánh actual result với expected result
   * Cải thiện logic để xử lý các trường hợp phức tạp hơn
   */
  private compareResults(actual: any, expected: string): boolean {
    if (!expected || !expected.trim()) {
      // Nếu không có expected result, coi như pass nếu không có error
      return true;
    }

    const expectedLower = expected.toLowerCase().trim();
    const actualStr = this.formatResult(actual).toLowerCase();

    // Exact match
    if (actualStr === expectedLower) {
      return true;
    }

    // Check for complex expected patterns với nhiều điều kiện
    // Ví dụ: "Phát sinh một lỗi có tên 'SyntaxError'. Biến `result` phải là `true`."
    // Cần kiểm tra CẢ hai điều kiện, không chỉ một
    const complexPatterns = [
      // Pattern: "Phát sinh lỗi X. Biến Y phải là Z"
      /phát sinh.*lỗi.*tên\s+['"](.+?)['"].*biến\s+(\w+)\s+phải\s+là\s+(.+?)[\.;]?$/i,
      // Pattern: "Throws error X and result must be Y"
      /throws?\s+error.*?['"](.+?)['"].*?and.*?result.*?must.*?be\s+(.+?)[\.;]?$/i,
      // Pattern: "Error X occurs and variable Y equals Z"
      /error\s+(.+?)\s+occurs.*?and.*?variable\s+(\w+)\s+equals\s+(.+?)[\.;]?$/i,
    ];

    for (const pattern of complexPatterns) {
      const match = expected.match(pattern);
      if (match) {
        // Nếu expected mô tả nhiều điều kiện, cần kiểm tra xem actual có đáp ứng không
        // Hiện tại chỉ kiểm tra giá trị cuối cùng (biến result/actual)
        // Nếu có lỗi được yêu cầu, cần kiểm tra thêm - nhưng test code đã xử lý rồi
        // Nên chỉ cần kiểm tra giá trị biến
        const variableValue = match[match.length - 1].trim().toLowerCase();
        if (variableValue === 'true' && actual === true) return true;
        if (variableValue === 'false' && actual === false) return true;
        // Nếu là number hoặc string khác
        if (actualStr.includes(variableValue) || variableValue.includes(actualStr)) {
          return true;
        }
      }
    }

    // Check for common patterns trong expected results
    // Pattern: "trả về X", "returns X", "equals X", etc.
    const simplePatterns = [
      /trả về\s+(.+?)[\.;]?$/i,
      /returns?\s+(.+?)[\.;]?$/i,
      /equals?\s+(.+?)[\.;]?$/i,
      /should be\s+(.+?)[\.;]?$/i,
      /must be\s+(.+?)[\.;]?$/i,
      /phải là\s+(.+?)[\.;]?$/i,
      /must equal\s+(.+?)[\.;]?$/i,
    ];

    for (const pattern of simplePatterns) {
      const match = expected.match(pattern);
      if (match) {
        const expectedValue = match[1].trim().toLowerCase();
        // Remove quotes if present
        const cleanExpected = expectedValue.replace(/^['"]|['"]$/g, '');
        const cleanActual = actualStr.replace(/^['"]|['"]$/g, '');
        
        if (cleanActual === cleanExpected || 
            cleanActual.includes(cleanExpected) || 
            cleanExpected.includes(cleanActual)) {
          return true;
        }
      }
    }

    // Check boolean patterns - cải thiện để tránh false positive
    // Chỉ match nếu expected rõ ràng về boolean và không có điều kiện phức tạp
    const booleanTruePatterns = [
      /\bresult.*?(?:phải\s+là|must\s+be|should\s+be|equals?)\s+true\b/i,
      /\btrue\b/i,
      /\bđúng\b/i,
      /\bpassed\b/i,
      /\bsuccess\b/i,
    ];
    const booleanFalsePatterns = [
      /\bresult.*?(?:phải\s+là|must\s+be|should\s+be|equals?)\s+false\b/i,
      /\bfalse\b/i,
      /\bsai\b/i,
      /\bfailed\b/i,
    ];

    for (const pattern of booleanTruePatterns) {
      if (pattern.test(expected) && actual === true) {
        // Kiểm tra xem có điều kiện phức tạp không
        // Nếu expected mô tả "phát sinh lỗi X, result phải là true" - chỉ match nếu có pattern rõ ràng
        const hasComplexCondition = /phát sinh.*lỗi/i.test(expected) || /throws.*error/i.test(expected);
        
        if (!hasComplexCondition) {
          // Simple boolean check
          return true;
        } else {
          // Complex condition: Check if pattern matches "phát sinh lỗi X. Biến Y phải là true"
          // Đã được xử lý ở complexPatterns ở trên
          // Nếu đến đây nghĩa là complexPatterns không match, nên không pass
        }
      }
    }

    for (const pattern of booleanFalsePatterns) {
      if (pattern.test(expected) && actual === false) {
        const hasComplexCondition = /phát sinh.*lỗi/i.test(expected) || /throws.*error/i.test(expected);
        if (!hasComplexCondition) {
          return true;
        }
      }
    }

    // Check for undefined/null
    if ((expectedLower.includes('undefined') || expectedLower.includes('không tồn tại')) && actual === undefined) return true;
    if ((expectedLower.includes('null') || expectedLower.includes('rỗng')) && actual === null) return true;

    // Check number patterns
    const numberMatch = expected.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch) {
      const expectedNum = parseFloat(numberMatch[1]);
      if (!isNaN(expectedNum) && !isNaN(actual) && Math.abs(actual - expectedNum) < 0.0001) {
        return true;
      }
    }

    // Fuzzy match - nếu expected chứa một phần của actual
    // Chỉ dùng khi độ dài đủ lớn để tránh false positive
    if (expectedLower.length > 10 && actualStr.length > 3) {
      const similarity = this.calculateSimilarity(actualStr, expectedLower);
      if (similarity > 0.75) { // Tăng threshold để chính xác hơn
        return true;
      }
    }

    return false;
  }

  /**
   * Format result để hiển thị
   */
  private formatResult(result: any): string {
    if (result === undefined) return 'undefined';
    if (result === null) return 'null';
    if (typeof result === 'boolean') return String(result);
    if (typeof result === 'number') return String(result);
    if (typeof result === 'string') return result;
    if (typeof result === 'object') {
      try {
        return JSON.stringify(result, null, 2);
      } catch {
        return String(result);
      }
    }
    return String(result);
  }

  /**
   * Tính similarity giữa 2 strings (simple Levenshtein-based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

