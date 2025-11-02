import { GoogleGenerativeAI } from '@google/generative-ai';
import { AISummary, SuggestedTest, Repo } from '../types/index.js';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string, modelName: string = 'gemini-2.0-flash-exp') {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * LUỒNG 1: Tạo prompt để phân tích risks/bugs trong code
   */
  private createRiskAnalysisPrompt(codeContent: string, fileName: string, language: string): string {
    return `Bạn là Model AI. Bạn đang đóng vai trò để tôi tích hợp AI vào dự án của tôi. Hãy làm chuyên nghiệp nhất có thể theo yêu cầu sau:

Bạn là một chuyên gia QA/Testing có 10 năm kinh nghiệm. Nhiệm vụ của bạn là phân tích code và phát hiện các Potential Risks và bugs (nếu có) tồn tại trong code.

## CONTEXT:
File code cần được phân tích:
- File name: ${fileName}
- Language: ${language}
- Code content:
\`\`\`${language}
${codeContent}
\`\`\`

## YÊU CẦU:
Hãy phân tích code này một cách kỹ lưỡng và phát hiện:

1. **Potential Risks**: Danh sách các rủi ro tiềm ẩn về:
   - Security (bảo mật): SQL injection, XSS, path traversal, authentication issues, etc.
   - Performance (hiệu suất): memory leaks, inefficient algorithms, blocking operations
   - Logic errors (lỗi logic): wrong comparisons, missing validations, incorrect calculations
   - Robustness (độ mạnh mẽ): missing error handling, unhandled edge cases, null pointer risks
   - Compatibility (tương thích): platform-specific issues, browser compatibility

2. **Detected Bugs**: Danh sách các bugs rõ ràng trong code (nếu có):
   - Logic bugs: missing return statements, incorrect variable assignments, wrong method calls
   - Syntax issues: type mismatches, incorrect operators
   - Implementation errors: methods not working as intended

3. **Overview**: Mô tả tổng quan về chức năng của code (2-3 câu)

4. **Detected Functions**: Danh sách tất cả functions/methods được phát hiện

5. **Detected Classes**: Danh sách tất cả classes/modules được phát hiện

## FORMAT OUTPUT:
Trả về JSON hợp lệ với cấu trúc:
{
  "overview": "...",
  "risks": [
    "Rủi ro Security (Xử lý tên file): Mô tả chi tiết...",
    "Rủi ro Logic (Xử lý các trường hợp biên): Mô tả chi tiết...",
    ...
  ],
  "bugs": [
    "Bug: deleteProduct không gán lại this.products...",
    ...
  ],
  "detectedFunctions": ["function1", "function2", ...],
  "detectedClasses": ["Class1", "Class2", ...]
}

## QUY TẮC:
- Phải phân tích kỹ lưỡng từng function/method
- Tối thiểu 5 risks (nếu có)
- Mỗi risk phải mô tả rõ ràng: loại rủi ro (Security/Logic/Performance/Robustness/Compatibility) và mô tả chi tiết
- Bugs phải chỉ ra cụ thể vị trí và nguyên nhân
- Phải response bằng tiếng Việt

CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT THÊM BÊN NGOÀI JSON.`;
  }

  /**
   * LUỒNG 2: Tạo prompt để sinh test cases dựa trên risks và code
   */
  private createTestCasesPrompt(codeContent: string, risks: string[], bugs: string[], fileName: string, language: string): string {
    const risksText = risks.length > 0 ? risks.map((r, i) => `${i + 1}. ${r}`).join('\n') : 'Không có risks được phát hiện.';
    const bugsText = bugs.length > 0 ? bugs.map((b, i) => `${i + 1}. ${b}`).join('\n') : 'Không có bugs được phát hiện.';

    return `Bạn là Model AI. Bạn đang đóng vai trò để tôi tích hợp AI vào dự án của tôi. Hãy làm chuyên nghiệp nhất có thể theo yêu cầu sau:

Bạn là một chuyên gia QA/Testing có 10 năm kinh nghiệm. Nhiệm vụ của bạn là dựa vào các risk của code và đoạn code. Sau đó tạo ra danh sách test cases, kèm theo đó là đoạn code test kèm với từng test case.

## RISKS PHÁT HIỆN:
${risksText}

## BUGS PHÁT HIỆN:
${bugsText}

## CODE CẦN TEST:
- File name: ${fileName}
- Language: ${language}
- Code content:
\`\`\`${language}
${codeContent}
\`\`\`

## YÊU CẦU QUAN TRỌNG:
⚠️ QUAN TRỌNG: TẤT CẢ TEST CASES PHẢI TEST CODE THỰC TẾ Ở PHẦN "CODE CẦN TEST" Ở TRÊN. 
- KHÔNG được tạo test case cho code khác không có trong CODE CẦN TEST
- KHÔNG được test JavaScript syntax error, file paths, hoặc các thứ không liên quan đến CODE CẦN TEST
- PHẢI sử dụng các classes/functions có trong CODE CẦN TEST để test

Tạo danh sách test cases chi tiết dựa trên:
1. Các risks đã phát hiện (tạo test để verify và catch các risks này) - Test code thực tế ở CODE CẦN TEST
2. Các bugs đã phát hiện (tạo test để reproduce và verify bugs) - Test bugs trong code thực tế ở CODE CẦN TEST
3. Các functions/methods trong CODE CẦN TEST (bao phủ đầy đủ các test scenarios)

Mỗi test case phải có:
- name: Tên test case rõ ràng, mô tả scenario, PHẢI liên quan đến CODE CẦN TEST (ví dụ: TC001_BugRepro_DeleteProductNotWorking, TC002_BugRepro_GetProductByIdLooseComparison, TC003_HappyPath_AddProductSuccess)
- function: Tên function/method mà test này sẽ test
- code: ĐOẠN CODE TEST ĐẦY ĐỦ, CÓ THỂ CHẠY ĐƯỢC NGAY, bao gồm:
  * Source code của các classes/functions cần test (nếu cần)
  * Test utilities (assert functions, error classes, helpers)
  * Test execution code cụ thể cho test case này
  * Code phải tự chứa đầy đủ (self-contained), có thể chạy độc lập
  * Format: Code phải sử dụng các biến như \`result\`, \`actual\`, hoặc return value để lưu kết quả test
- type: Một trong ['unit', 'integration', 'negative', 'edge']
- complexity: 'S' (Simple), 'M' (Medium), 'L' (Large)
- description: Mô tả chi tiết về test case (2-3 câu)
- steps: Mảng các bước test với format {step: number, description: string, action: string}
- inputConditions: Mảng các điều kiện đầu vào cần chuẩn bị
- expectedResults: Kết quả mong đợi khi test pass (mô tả rõ ràng kết quả cụ thể)
- testScope: 'main' (kịch bản chính), 'sub' (luồng phụ), 'edge' (edge case)
- priority: 'high', 'medium', 'low'

## QUY TẮC:
ƯU TIÊN: BẮT BUỘC PHẢI TẠO RA CÁC TEST CASES. DÙ PASS HAY FAIL.

1. Tạo test cases bao phủ:
   - ✅ Happy path (main scenarios)
   - ✅ Negative cases (invalid inputs, error handling) - đặc biệt cho các risks
   - ✅ Edge cases (boundary conditions, extreme values)
   - ✅ Bug reproduction tests (để verify các bugs đã phát hiện)
   - ✅ Risk verification tests (để catch các risks đã phát hiện)

2. Ưu tiên:
   - Test các bugs đã phát hiện (priority cao)
   - Test các risks quan trọng (Security > Logic > Performance)
   - Test các functions quan trọng nhất trước
   - Test error handling paths
   - Test data validation

3. Format code test:
   Code test PHẢI giống như ví dụ minh họa sau:
   
   Ví dụ code test format (Nếu CODE CẦN TEST là ProductManager):
   \`\`\`javascript
   // --- Start Source Code and Test Utilities ---
   
   // PHẢI copy lại toàn bộ source code từ CODE CẦN TEST
   class ProductManager {
     constructor() {
       this.products = [];
     }
     
     addProduct(product) {
       this.products.push(product);
     }
     
     getProductById(id) {
       return this.products.find(p => p.id == id);
     }
     
     deleteProduct(id) {
       this.products.filter(p => p.id !== id);
     }
     
     updatePrice(id, newPrice) {
       const product = this.getProductById(id);
       if (product) {
         product.price = newPrice;
         return true;
       }
       return false;
     }
     
     getTotalInventoryValue() {
       return this.products.reduce((total, product) => total + product.price, 0);
     }
   }
   
   // --- End Source Code ---
   
   // Test execution code - PHẢI sử dụng ProductManager từ CODE CẦN TEST
   const pm = new ProductManager();
   pm.addProduct({ id: 1, name: 'Laptop', price: 1000, quantity: 5 });
   pm.addProduct({ id: 1, name: 'Duplicate', price: 500, quantity: 2 }); // Test bug: trùng ID
   
   // Test bug: getProductById dùng == thay vì ===
   const product1 = pm.getProductById('1'); // String ID
   const product2 = pm.getProductById(1);    // Number ID
   const result = (product1 !== undefined && product2 !== undefined && product1 === product2); // Bug: == so sánh '1' == 1 là true
   \`\`\`
   
   Lưu ý:
   - Ví dụ trên là cho ProductManager - NẾU CODE CẦN TEST là code khác, PHẢI sử dụng code đó
   - PHẢI copy lại toàn bộ source code từ CODE CẦN TEST vào phần "Start Source Code"
   - Test execution PHẢI sử dụng classes/functions từ CODE CẦN TEST
   
   ⚠️ QUAN TRỌNG BẬT NHẤT:
   - Code test PHẢI sử dụng các classes/functions từ CODE CẦN TEST (ở trên) để test
   - Code test PHẢI chứa lại toàn bộ source code của classes/functions từ CODE CẦN TEST (copy nguyên văn)
   - Code PHẢI có thể chạy được ngay (self-contained) - nghĩa là PHẢI copy lại toàn bộ code cần test vào trong code test
   - Test execution PHẢI gọi các methods từ CODE CẦN TEST (ví dụ: new ProductManager().addProduct(...))
   - Test execution PHẢI lưu kết quả vào biến \`result\` hoặc \`actual\` để hệ thống có thể so sánh
   - Code PHẢI xử lý được cả happy path và error cases
   - Nếu test error case, sử dụng try-catch và lưu error vào biến hoặc throw error
   - Code PHẢI đầy đủ, không thiếu dependencies
   - KHÔNG được test các thứ không có trong CODE CẦN TEST (như JavaScript syntax error, file paths, v.v.)

4. Format output: Trả về JSON hợp lệ với cấu trúc:
{
  "suggestedTests": [
    {
      "name": "TC001_BugRepro_DeleteProductNotWorking",
      "function": "ProductManager.deleteProduct",
      "code": "// --- Start Source Code ---\nclass ProductManager {\n  constructor() {\n    this.products = [];\n  }\n  addProduct(product) {\n    this.products.push(product);\n  }\n  getProductById(id) {\n    return this.products.find(p => p.id == id);\n  }\n  deleteProduct(id) {\n    this.products.filter(p => p.id !== id);\n  }\n  updatePrice(id, newPrice) {\n    const product = this.getProductById(id);\n    if (product) {\n      product.price = newPrice;\n      return true;\n    }\n    return false;\n  }\n  getTotalInventoryValue() {\n    return this.products.reduce((total, product) => total + product.price, 0);\n  }\n}\n// --- End Source Code ---\n\n// Test execution\nconst pm = new ProductManager();\npm.addProduct({ id: 1, name: 'Laptop', price: 1000, quantity: 5 });\npm.deleteProduct(1);\nconst result = pm.products.length; // Bug: vẫn còn 1 vì không cập nhật mảng",
      "type": "negative",
      "complexity": "S",
      "description": "Test bug: deleteProduct không cập nhật mảng products sau khi filter",
      "steps": [
        {"step": 1, "description": "Tạo ProductManager và thêm 1 product", "action": "new ProductManager(); addProduct({ id: 1, ... })"},
        {"step": 2, "description": "Gọi deleteProduct(1)", "action": "deleteProduct(1)"},
        {"step": 3, "description": "Kiểm tra số lượng products", "action": "pm.products.length"}
      ],
      "inputConditions": ["1 product với ID 1"],
      "expectedResults": "products.length phải là 0, nhưng bug khiến nó vẫn là 1",
      "testScope": "main",
      "priority": "high"
    },
    ...
  ]
}

5. Đảm bảo:
   - Mỗi function quan trọng có ít nhất 2-3 test cases
   - Có ít nhất 1 negative test case cho mỗi function
   - Có ít nhất 1 edge case test
   - Mỗi bug có ít nhất 1 test case để reproduce
   - Mỗi risk quan trọng có ít nhất 1 test case để verify
   - Tổng số test cases: ít nhất 5, tối đa 15
   - Code test PHẢI đầy đủ, self-contained, có thể chạy được ngay
   - Code PHẢI lưu kết quả vào biến \`result\` hoặc \`actual\` để hệ thống so sánh

CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT THÊM BÊN NGOÀI JSON.`;
  }

  /**
   * Tạo prompt chuẩn để phân tích code và sinh test cases (DEPRECATED - giữ lại để backward compatibility)
   */
  private createAnalysisPrompt(codeContent: string, fileName: string, language: string): string {
    return `Bạn là Model AI. Bạn đang đóng vai trò để tôi tích hợp AI vào dự án của tôi. Hãy làm chuyên nghiệp nhất có thể theo yêu cầu sau:

Bạn là một chuyên gia QA/Testing có 10 năm kinh nghiệm. Nhiệm vụ của bạn là phân tích code và tạo ra danh sách test cases chi tiết theo đoạn code mà user của tôi upload lên như sau:

## CONTEXT:
File code cần được phân tích:
- File name: ${fileName}
- Language: ${language}
- Code content:
\`\`\`${language}
${codeContent}
\`\`\`

## YÊU CẦU:
Hãy phân tích code này một cách kỹ lưỡng và tạo ra:

1. **AI Summary** bao gồm:
   - Overview: Mô tả tổng quan về chức năng của code (2-3 câu)
   - Risks: Danh sách các rủi ro tiềm ẩn về security, performance, logic errors (tối thiểu 5 items)
   - Detected Functions: Danh sách tất cả functions/methods được phát hiện
   - Detected Classes: Danh sách tất cả classes/modules được phát hiện

2. **Suggested Test Cases**: Tạo danh sách test cases chi tiết với cấu trúc sau:
   - Mỗi test case phải có:
     * name: Tên test case rõ ràng, mô tả scenario
     * function: Tên function/method mà test này sẽ test
     * code: Đoạn code / hàm code để test đoạn code đó
     * type: Một trong ['unit', 'integration', 'negative', 'edge']
     * complexity: 'S' (Simple), 'M' (Medium), 'L' (Large)
     * description: Mô tả chi tiết về test case (2-3 câu)
     * steps: Mảng các bước test với format {step: number, description: string, action: string}
     * inputConditions: Mảng các điều kiện đầu vào cần chuẩn bị
     * expectedResults: Kết quả mong đợi khi test pass
     * testScope: 'main' (kịch bản chính), 'sub' (luồng phụ), 'edge' (edge case)
     * priority: 'high', 'medium', 'low'

## QUY TẮC:
ƯU TIÊN: BẮT BUỘC PHẢI TẠO RA CÁC TEST CASES. DÙ PASS HAY FAIL.

1. Tạo test cases bao phủ:
   - ✅ Happy path (main scenarios)
   - ✅ Negative cases (invalid inputs, error handling)
   - ✅ Edge cases (boundary conditions, extreme values)
   - ✅ Integration points (nếu có)

2. Ưu tiên:
   - Test các functions quan trọng nhất trước
   - Test security vulnerabilities nếu phát hiện
   - Test error handling paths
   - Test data validation

3. Format output: Trả về JSON hợp lệ với cấu trúc:
{
  "aiSummary": {
    "overview": "...",
    "risks": ["...", "..."],
    "detectedFunctions": ["...", "..."],
    "detectedClasses": ["...", "..."]
  },
  "suggestedTests": [
    {
      "name": "...",
      "function": "...",
      "code": "...",
      "type": "unit|integration|negative|edge",
      "complexity": "S|M|L",
      "description": "...",
      "steps": [
        {"step": 1, "description": "...", "action": "..."},
        ...
      ],
      "inputConditions": ["...", "..."],
      "expectedResults": "...",
      "testScope": "main|sub|edge",
      "priority": "high|medium|low"
    },
    ...
  ],
  "repo": {
    "files": ["..."],
    "detectedTech": ["..."]
  }
}

4. Đảm bảo:
   - Mỗi function quan trọng có ít nhất 2-3 test cases
   - Có ít nhất 1 negative test case cho mỗi function
   - Có ít nhất 1 edge case test
   - Tổng số test cases: ít nhất 5, tối đa 15
   - Phải response ra tiếng Việt.

CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT THÊM BÊN NGOÀI JSON.`;
  }

  /**
   * LUỒNG 1: Phân tích risks và bugs trong code
   */
  async analyzeRisks(
    codeContent: string,
    fileName: string,
    language: string
  ): Promise<{ overview: string; risks: string[]; bugs: string[]; detectedFunctions: string[]; detectedClasses: string[] }> {
    try {
      const prompt = this.createRiskAnalysisPrompt(codeContent, fileName, language);
      
      console.log(`[Gemini] Analyzing risks for file: ${fileName} (${language})`);
      
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Parse JSON từ response
      let jsonText = text.trim();
      
      // Loại bỏ markdown code blocks nếu có
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(jsonText);
      
      return {
        overview: parsed.overview || '',
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
        bugs: Array.isArray(parsed.bugs) ? parsed.bugs : [],
        detectedFunctions: Array.isArray(parsed.detectedFunctions) ? parsed.detectedFunctions : [],
        detectedClasses: Array.isArray(parsed.detectedClasses) ? parsed.detectedClasses : [],
      };
    } catch (error: any) {
      console.error('[Gemini] Error analyzing risks:', error);
      
      return {
        overview: 'Unable to analyze risks. Please check the file content.',
        risks: ['Analysis failed'],
        bugs: [],
        detectedFunctions: [],
        detectedClasses: [],
      };
    }
  }

  /**
   * LUỒNG 2: Sinh test cases dựa trên risks, bugs và code
   */
  async generateTestCases(
    codeContent: string,
    risks: string[],
    bugs: string[],
    fileName: string,
    language: string
  ): Promise<SuggestedTest[]> {
    try {
      console.log(`[Gemini] ========== START generateTestCases ==========`);
      console.log(`[Gemini] File: ${fileName} (${language})`);
      console.log(`[Gemini] Code content length: ${codeContent.length} chars`);
      console.log(`[Gemini] Code content preview (first 200 chars): ${codeContent.substring(0, 200)}...`);
      console.log(`[Gemini] Risks count: ${risks.length}`);
      console.log(`[Gemini] Bugs count: ${bugs.length}`);
      console.log(`[Gemini] Risks:`, risks.slice(0, 3)); // Log first 3 risks
      console.log(`[Gemini] Bugs:`, bugs.slice(0, 3)); // Log first 3 bugs
      
      const prompt = this.createTestCasesPrompt(codeContent, risks, bugs, fileName, language);
      console.log(`[Gemini] Prompt length: ${prompt.length} chars`);
      console.log(`[Gemini] Prompt preview (first 500 chars): ${prompt.substring(0, 500)}...`);
      
      console.log(`[Gemini] Calling Gemini API...`);
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      console.log(`[Gemini] Response received, length: ${text.length} chars`);
      console.log(`[Gemini] Response preview (first 500 chars): ${text.substring(0, 500)}...`);
      
      // Parse JSON từ response
      let jsonText = text.trim();
      
      // Loại bỏ markdown code blocks nếu có
      if (jsonText.startsWith('```json')) {
        const jsonBlockPattern = /```json\n?/g;
        const endBlockPattern = /```\n?$/g;
        jsonText = jsonText.replace(jsonBlockPattern, '').replace(endBlockPattern, '');
        console.log('[Gemini] Removed json markdown blocks');
      } else if (jsonText.startsWith('```')) {
        const blockPattern = /```\n?/g;
        jsonText = jsonText.replace(blockPattern, '');
        console.log('[Gemini] Removed markdown blocks');
      }
      
      console.log(`[Gemini] JSON text after cleaning, length: ${jsonText.length} chars`);
      const jsonPreview = jsonText.substring(0, 300);
      console.log(`[Gemini] JSON preview (first 300 chars): ${jsonPreview}...`);
      
      let parsed: any;
      try {
        parsed = JSON.parse(jsonText);
        console.log('[Gemini] JSON parsed successfully');
        console.log('[Gemini] Parsed keys:', Object.keys(parsed));
        console.log(`[Gemini] suggestedTests type: ${typeof parsed.suggestedTests}`);
        console.log(`[Gemini] suggestedTests is array: ${Array.isArray(parsed.suggestedTests)}`);
        console.log(`[Gemini] suggestedTests length: ${parsed.suggestedTests?.length || 0}`);
      } catch (parseError: any) {
        console.error('[Gemini] JSON Parse Error:', parseError.message);
        const errorPreview = jsonText.substring(0, 1000);
        console.error(`[Gemini] JSON text that failed to parse: ${errorPreview}`);
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }

      if (!parsed.suggestedTests) {
        console.warn('[Gemini] WARNING: parsed.suggestedTests is undefined or null!');
        const parsedStr = JSON.stringify(parsed, null, 2).substring(0, 500);
        console.warn(`[Gemini] Parsed object: ${parsedStr}`);
        return [];
      }

      if (!Array.isArray(parsed.suggestedTests)) {
        console.error(`[Gemini] ERROR: parsed.suggestedTests is not an array! Type: ${typeof parsed.suggestedTests}`);
        console.error('[Gemini] Value:', parsed.suggestedTests);
        return [];
      }

      console.log(`[Gemini] Processing ${parsed.suggestedTests.length} test cases...`);

      const suggestedTests: SuggestedTest[] = (parsed.suggestedTests || []).map((test: any, index: number) => {
        const testName = test.name || 'unnamed';
        console.log(`[Gemini] Processing test ${index + 1}: ${testName}`);
        
        return {
          id: `test-${Date.now()}-${index}`,
          name: test.name || `Test Case ${index + 1}`,
          function: test.function || 'unknown',
          code: test.code || '',
          type: ['unit', 'integration', 'negative', 'edge'].includes(test.type) 
            ? test.type 
            : 'unit',
          complexity: ['S', 'M', 'L'].includes(test.complexity) 
            ? test.complexity 
            : 'M',
          selected: false,
          description: test.description || '',
          steps: Array.isArray(test.steps) 
            ? test.steps.map((s: any, i: number) => ({
                step: s.step || i + 1,
                description: s.description || '',
                action: s.action || '',
              }))
            : [],
          inputConditions: Array.isArray(test.inputConditions) 
            ? test.inputConditions 
            : [],
          expectedResults: test.expectedResults || '',
          testScope: ['main', 'sub', 'edge'].includes(test.testScope) 
            ? test.testScope 
            : 'main',
          priority: ['high', 'medium', 'low'].includes(test.priority) 
            ? test.priority 
            : 'medium',
        };
      });

      console.log(`[Gemini] Successfully generated ${suggestedTests.length} test cases`);
      console.log(`[Gemini] ========== END generateTestCases ==========`);

      return suggestedTests;
    } catch (error: any) {
      console.error('[Gemini] ========== ERROR in generateTestCases ==========');
      console.error('[Gemini] Error message:', error.message);
      console.error('[Gemini] Error stack:', error.stack);
      console.error('[Gemini] File:', fileName);
      console.error('[Gemini] Language:', language);
      console.error('[Gemini] ===============================================');
      return [];
    }
  }

  /**
   * Phân tích code và trả về test cases (SỬ DỤNG 2 LUỒNG)
   */
  async analyzeCode(
    codeContent: string,
    fileName: string,
    language: string,
    existingRepo?: Repo
  ): Promise<{ aiSummary: AISummary; suggestedTests: SuggestedTest[]; repo: Repo }> {
    try {
      console.log(`[Gemini] Starting analysis for file: ${fileName} (${language})`);
      
      // LUỒNG 1: Phân tích risks và bugs
      const riskAnalysis = await this.analyzeRisks(codeContent, fileName, language);
      
      // LUỒNG 2: Sinh test cases dựa trên risks, bugs và code
      console.log(`[Gemini] About to call generateTestCases...`);
      console.log(`[Gemini] Code content length for test generation: ${codeContent.length}`);
      console.log(`[Gemini] Risks to pass: ${riskAnalysis.risks.length}`);
      console.log(`[Gemini] Bugs to pass: ${riskAnalysis.bugs.length}`);
      
      const suggestedTests = await this.generateTestCases(
        codeContent,
        riskAnalysis.risks,
        riskAnalysis.bugs,
        fileName,
        language
      );

      console.log(`[Gemini] generateTestCases returned ${suggestedTests.length} test cases`);

      // Format AI Summary
      const aiSummary: AISummary = {
        overview: riskAnalysis.overview,
        risks: riskAnalysis.risks,
        detectedFunctions: riskAnalysis.detectedFunctions,
        detectedClasses: riskAnalysis.detectedClasses,
      };

      const repo: Repo = {
        url: existingRepo?.url,
        files: existingRepo?.files || [fileName],
        detectedTech: existingRepo?.detectedTech || [language],
      };

      console.log(`[Gemini] ========== Analysis complete ==========`);
      console.log(`[Gemini] Test cases: ${suggestedTests.length}`);
      console.log(`[Gemini] Risks: ${riskAnalysis.risks.length}`);
      console.log(`[Gemini] Bugs: ${riskAnalysis.bugs.length}`);
      console.log(`[Gemini] ========================================`);

      return {
        aiSummary,
        suggestedTests,
        repo,
      };
    } catch (error: any) {
      console.error('[Gemini] Error analyzing code:', error);
      
      // Fallback response nếu có lỗi
      return {
        aiSummary: {
          overview: 'Unable to analyze code. Please check the file content.',
          risks: ['Analysis failed'],
          detectedFunctions: [],
          detectedClasses: [],
        },
        suggestedTests: [],
        repo: {
          files: [fileName],
          detectedTech: [language],
        },
      };
    }
  }

  /**
   * Phân tích multiple files và merge results
   */
  async analyzeMultipleFiles(
    files: Array<{ content: string; name: string; language: string }>
  ): Promise<{ aiSummary: AISummary; suggestedTests: SuggestedTest[]; repo: Repo }> {
    console.log(`[Gemini] ========== START analyzeMultipleFiles ==========`);
    console.log(`[Gemini] Files count: ${files.length}`);
    
    if (files.length === 0) {
      throw new Error('No files provided');
    }

    let mergedSummary: AISummary = {
      overview: '',
      risks: [],
      detectedFunctions: [],
      detectedClasses: [],
    };
    
    let allTests: SuggestedTest[] = [];
    const allFiles: string[] = [];
    const allTech: string[] = [];

    // Phân tích từng file và merge
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[Gemini] Processing file ${i + 1}/${files.length}: ${file.name}`);
      console.log(`[Gemini] File content length: ${file.content.length}`);
      
      try {
        const result = await this.analyzeCode(file.content, file.name, file.language);
        
        console.log(`[Gemini] File ${i + 1} analysis complete:`);
        console.log(`[Gemini]   - Suggested tests: ${result.suggestedTests.length}`);
        console.log(`[Gemini]   - Risks: ${result.aiSummary.risks.length}`);
        console.log(`[Gemini]   - Bugs: (from previous analysis)`);
        
        mergedSummary.overview += result.aiSummary.overview + ' ';
        mergedSummary.risks.push(...result.aiSummary.risks);
        mergedSummary.detectedFunctions.push(...result.aiSummary.detectedFunctions);
        mergedSummary.detectedClasses.push(...result.aiSummary.detectedClasses);
        
        allTests.push(...result.suggestedTests);
        allFiles.push(...result.repo.files);
        allTech.push(...result.repo.detectedTech);
        
        console.log(`[Gemini]   ✓ File ${i + 1} processed. Total tests so far: ${allTests.length}`);
      } catch (error: any) {
        console.error(`[Gemini] ✗ Error processing file ${i + 1} (${file.name}):`, error.message);
        console.error(`[Gemini] Error stack:`, error.stack);
        // Continue với các file khác
      }
    }

    console.log(`[Gemini] Before deduplication: ${allTests.length} test cases`);

    // Deduplicate
    mergedSummary.risks = [...new Set(mergedSummary.risks)];
    mergedSummary.detectedFunctions = [...new Set(mergedSummary.detectedFunctions)];
    mergedSummary.detectedClasses = [...new Set(mergedSummary.detectedClasses)];
    const uniqueFiles = [...new Set(allFiles)];
    const uniqueTech = [...new Set(allTech)];

    console.log(`[Gemini] After deduplication:`);
    console.log(`[Gemini]   - Test cases: ${allTests.length}`);
    console.log(`[Gemini]   - Risks: ${mergedSummary.risks.length}`);
    console.log(`[Gemini]   - Functions: ${mergedSummary.detectedFunctions.length}`);
    console.log(`[Gemini]   - Classes: ${mergedSummary.detectedClasses.length}`);
    console.log(`[Gemini] ========== END analyzeMultipleFiles ==========`);

    return {
      aiSummary: mergedSummary,
      suggestedTests: allTests,
      repo: {
        files: uniqueFiles,
        detectedTech: uniqueTech,
      },
    };
  }

  /**
   * Tạo AI explanation cho test failures
   */
  async explainTestFailure(
    testName: string,
    error: string,
    codeContext: string
  ): Promise<{ cause: string; suggestion: string; severity: 'low' | 'medium' | 'high' }> {
    const prompt = `Bạn là một chuyên gia debugging có 10 năm kinh nghiệm. 

Test case "${testName}" đã fail với error:
\`\`\`
${error}
\`\`\`

Code context:
\`\`\`
${codeContext}
\`\`\`

Hãy phân tích và đưa ra:
1. Cause: Nguyên nhân gốc rễ của lỗi (2-3 câu)
2. Suggestion: Giải pháp cụ thể để fix (danh sách các bước)
3. Severity: 'low', 'medium', hoặc 'high'

Trả về JSON format:
{
  "cause": "...",
  "suggestion": "...",
  "severity": "low|medium|high"
}

CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT THÊM.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      let text = response.text().trim();
      
      if (text.startsWith('```json')) {
        text = text.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(text);
      
      return {
        cause: parsed.cause || 'Unknown cause',
        suggestion: parsed.suggestion || 'Please review the test and code manually',
        severity: ['low', 'medium', 'high'].includes(parsed.severity) 
          ? parsed.severity 
          : 'medium',
      };
    } catch (error) {
      console.error('[Gemini] Error explaining test failure:', error);
      return {
        cause: 'Unable to analyze failure',
        suggestion: 'Please review the test and code manually',
        severity: 'medium' as const,
      };
    }
  }
}