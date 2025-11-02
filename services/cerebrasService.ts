import type {
  FunctionalRequirement,
  NonFunctionalRequirement,
  ConflictDetection,
  TestabilityScore,
  RequirementAnalysis,
  TestCaseSuggestion,
} from '../types';

const API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY || '';
const API_BASE_URL = 'https://api.cerebras.ai/v1'; // Điều chỉnh URL thực tế khi có

if (!API_KEY) {
  console.warn('VITE_CEREBRAS_API_KEY is not set. Cerebras service will not work.');
}

const MODEL_NAME = 'llama-4-scout-17b-16e-instruct';

/**
 * Call Cerebras API for chat completion
 */
async function callCerebrasAPI(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error('Cerebras API key is not configured');
  }

  try {
    // Note: Cerebras Cloud API endpoint structure may vary
    // This is a placeholder implementation - adjust based on actual API docs
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cerebras API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    // Extract text from response (adjust based on actual API response structure)
    return data.choices?.[0]?.message?.content || data.text || JSON.stringify(data);
  } catch (error) {
    throw new Error(`Error calling Cerebras API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse JSON from AI response (remove markdown code blocks if any)
 */
function parseJSONFromResponse(text: string): any {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from Cerebras');
  }
  return JSON.parse(jsonMatch[0]);
}

/**
 * Classify requirements into Functional (FR) and Non-Functional (NFR)
 */
export async function classifyRequirements(
  documentContent: string
): Promise<{ functional: FunctionalRequirement[]; nonFunctional: NonFunctionalRequirement[] }> {
  const prompt = `Bạn là một chuyên gia phân tích tài liệu yêu cầu phần mềm (Requirements Analyst) với 15 năm kinh nghiệm.

NHIỆM VỤ: Phân loại chính xác các yêu cầu trong tài liệu thành Functional Requirements (FR) và Non-Functional Requirements (NFR).

TÀI LIỆU CẦN PHÂN TÍCH:
${documentContent}

---
PHÂN BIỆT RÕ RÀNG GIỮA FR VÀ NFR:

📌 FUNCTIONAL REQUIREMENTS (FR) - Yêu cầu chức năng:
Là những yêu cầu mô tả "HỆ THỐNG PHẢI LÀM GÌ" - các chức năng cụ thể, hành động, tính năng mà hệ thống phải thực hiện.

 VÍ DỤ FR:
- "Hệ thống phải cho phép người dùng đăng nhập bằng email và mật khẩu"
- "Hệ thống phải hiển thị danh sách sản phẩm với giá và mô tả"
- "Hệ thống phải cho phép người dùng thêm sản phẩm vào giỏ hàng"
- "Hệ thống phải tạo hóa đơn điện tử khi thanh toán thành công"
- "Hệ thống phải cho phép admin xóa, sửa thông tin người dùng"
- "Hệ thống phải gửi email xác nhận khi đăng ký tài khoản"
- "Hệ thống phải tính toán tổng tiền dựa trên giá và số lượng"

🔍 TỪ KHÓA NHẬN DIỆN FR: "phải", "cho phép", "hiển thị", "tạo", "xóa", "sửa", "tính toán", "gửi", "nhận", "lưu trữ", "tìm kiếm", "xuất", "import", "đăng nhập", "đăng ký", "thanh toán", "báo cáo", "thống kê", "quản lý"

---
📌 NON-FUNCTIONAL REQUIREMENTS (NFR) - Yêu cầu phi chức năng:
Là những yêu cầu mô tả "HỆ THỐNG PHẢI NHƯ THẾ NÀO" - chất lượng, hiệu năng, bảo mật, khả năng sử dụng, ràng buộc kỹ thuật.

 VÍ DỤ NFR:

1. PERFORMANCE (Hiệu năng):
- "Hệ thống phải phản hồi trong vòng 2 giây cho mọi request"
- "Trang web phải load trong vòng 3 giây"
- "API phải xử lý tối thiểu 1000 requests/giây"
- "Database query phải hoàn thành trong < 500ms"

2. SECURITY (Bảo mật):
- "Dữ liệu phải được mã hóa với SSL/TLS"
- "Mật khẩu phải được hash bằng bcrypt"
- "Hệ thống phải có xác thực 2 yếu tố (2FA)"
- "API phải có rate limiting để chống DDoS"

3. USABILITY (Khả năng sử dụng):
- "Giao diện phải thân thiện, dễ sử dụng cho người không chuyên"
- "Hệ thống phải hỗ trợ đa ngôn ngữ"
- "Ứng dụng phải có hướng dẫn sử dụng"

4. RELIABILITY (Độ tin cậy):
- "Hệ thống phải có uptime 99.9%"
- "Dữ liệu phải được backup hàng ngày"
- "Hệ thống phải tự động recover khi lỗi"

5. SCALABILITY (Khả năng mở rộng):
- "Hệ thống phải hỗ trợ 10,000 người dùng đồng thời"
- "Kiến trúc phải hỗ trợ horizontal scaling"

6. MAINTAINABILITY (Khả năng bảo trì):
- "Code phải tuân thủ coding standards"
- "Hệ thống phải có logging và monitoring"

🔍 TỪ KHÓA NHẬN DIỆN NFR: "trong vòng", "tối thiểu", "tối đa", "phải hỗ trợ", "uptime", "phản hồi", "hiệu suất", "bảo mật", "mã hóa", "tốc độ", "thời gian", "khả năng", "chất lượng", "dễ sử dụng", "responsive", "tương thích", "compatible"

---
QUY TẮC PHÂN LOẠI:
1. Nếu yêu cầu mô tả HÀNH ĐỘNG/CHỨC NĂNG cụ thể → FR
2. Nếu yêu cầu mô tả CHẤT LƯỢNG/HIỆU NĂNG/RÀNG BUỘC → NFR
3. Một số yêu cầu có thể chứa cả 2 phần → ưu tiên phần chính

KẾT QUẢ TRẢ VỀ (CHỈ JSON, KHÔNG TEXT THÊM):
{
  "functional": [
    {
      "id": "FR-001",
      "title": "Tên yêu cầu ngắn gọn (1 câu)",
      "description": "Mô tả chi tiết đầy đủ yêu cầu chức năng",
      "category": "authentication" // optional: authentication, payment, reporting, user_management, data_management, notification, etc.
    }
  ],
  "nonFunctional": [
    {
      "id": "NFR-001",
      "title": "Tên yêu cầu ngắn gọn (1 câu)",
      "description": "Mô tả chi tiết đầy đủ yêu cầu phi chức năng",
      "type": "performance" // CHÍNH XÁC: performance, security, usability, reliability, scalability, maintainability, other
    }
  ]
}

QUAN TRỌNG: Phân tích kỹ từng yêu cầu, đảm bảo phân loại CHÍNH XÁC. Chỉ trả về JSON hợp lệ, không có text giải thích thêm.`;

  try {
    const responseText = await callCerebrasAPI(prompt);
    const parsed = parseJSONFromResponse(responseText);

    const functional: FunctionalRequirement[] = (parsed.functional || []).map((fr: any) => ({
      ...fr,
      clarityScore: 0,
      testabilityScore: 0,
      conflicts: [],
      suggestions: [],
    }));

    const nonFunctional: NonFunctionalRequirement[] = (parsed.nonFunctional || []).map((nfr: any) => ({
      ...nfr,
      clarityScore: 0,
      testabilityScore: 0,
      conflicts: [],
      suggestions: [],
    }));

    return { functional, nonFunctional };
  } catch (error) {
    throw new Error(`Error classifying requirements: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detect conflicts and contradictions in requirements
 */
export async function detectConflicts(
  functionalReqs: FunctionalRequirement[],
  nonFunctionalReqs: NonFunctionalRequirement[]
): Promise<ConflictDetection[]> {
  const requirementsText = `
Functional Requirements:
${functionalReqs.map((fr) => `- [${fr.id}] ${fr.title}: ${fr.description}`).join('\n')}

Non-Functional Requirements:
${nonFunctionalReqs.map((nfr) => `- [${nfr.id}] ${nfr.title}: ${nfr.description}`).join('\n')}
`;

  const prompt = `Bạn là một chuyên gia phân tích mâu thuẫn trong tài liệu yêu cầu.

Nhiệm vụ: Phát hiện các mâu thuẫn, trùng lặp, hoặc xung đột giữa các yêu cầu sau:

${requirementsText}

Hãy phân tích và trả về kết quả dưới dạng JSON:
{
  "conflicts": [
    {
      "id": "CONFLICT-001",
      "requirementIds": ["FR-001", "NFR-002"],
      "type": "contradiction",
      "severity": "high",
      "description": "Mô tả mâu thuẫn",
      "suggestion": "Đề xuất giải pháp"
    }
  ]
}

Chỉ trả về JSON, không có text thêm.`;

  try {
    const responseText = await callCerebrasAPI(prompt);
    const parsed = parseJSONFromResponse(responseText);
    return parsed.conflicts || [];
  } catch (error) {
    throw new Error(`Error detecting conflicts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Evaluate clarity and testability scores for requirements
 */
export async function evaluateTestability(
  functionalReqs: FunctionalRequirement[],
  nonFunctionalReqs: NonFunctionalRequirement[]
): Promise<{
  clarityScores: Record<string, number>;
  testabilityScores: TestabilityScore[];
}> {
  const requirementsText = `
Functional Requirements:
${functionalReqs.map((fr) => `- [${fr.id}] ${fr.title}: ${fr.description}`).join('\n')}

Non-Functional Requirements:
${nonFunctionalReqs.map((nfr) => `- [${nfr.id}] ${nfr.title}: ${nfr.description}`).join('\n')}
`;

  const prompt = `Bạn là một chuyên gia đánh giá chất lượng yêu cầu phần mềm.

Nhiệm vụ: Đánh giá độ rõ ràng (clarity) và khả năng kiểm thử (testability) cho từng yêu cầu.

${requirementsText}

Đánh giá theo các tiêu chí:
1. Clarity (0-100): Yêu cầu có rõ ràng, dễ hiểu không?
2. Testability (0-100): Yêu cầu có thể test được không?
   - Clarity (0-100): Rõ ràng, dễ hiểu
   - Measurability (0-100): Có thể đo lường được
   - SpecificInputOutput (0-100): Input/output cụ thể
   - TestableConditions (0-100): Điều kiện test được

Trả về JSON:
{
  "scores": [
    {
      "requirementId": "FR-001",
      "clarityScore": 85,
      "testability": {
        "score": 80,
        "criteria": {
          "clarity": 85,
          "measurability": 75,
          "specificInputOutput": 80,
          "testableConditions": 80
        },
        "reasoning": "Giải thích ngắn gọn"
      }
    }
  ]
}

Chỉ trả về JSON.`;

  try {
    const responseText = await callCerebrasAPI(prompt);
    const parsed = parseJSONFromResponse(responseText);
    const scores = parsed.scores || [];

    const clarityScores: Record<string, number> = {};
    const testabilityScores: TestabilityScore[] = [];

    scores.forEach((item: any) => {
      clarityScores[item.requirementId] = item.clarityScore || 0;
      if (item.testability) {
        testabilityScores.push({
          requirementId: item.requirementId,
          score: item.testability.score || 0,
          criteria: item.testability.criteria,
          reasoning: item.testability.reasoning || '',
        });
      }
    });

    return { clarityScores, testabilityScores };
  } catch (error) {
    throw new Error(`Error evaluating testability: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate test case suggestions for functional requirements
 */
export async function generateTestCases(
  functionalReqs: FunctionalRequirement[]
): Promise<TestCaseSuggestion[]> {
  const requirementsText = functionalReqs
    .map((fr) => `- [${fr.id}] ${fr.title}: ${fr.description}`)
    .join('\n');

  const prompt = `Bạn là một chuyên gia QA Automation.

Nhiệm vụ: Sinh test cases cho các functional requirements sau:

${requirementsText}

Với mỗi requirement, sinh 1-2 test cases quan trọng nhất theo format Given/When/Then.

Trả về JSON:
{
  "testCases": [
    {
      "id": "TC-001",
      "requirementId": "FR-001",
      "title": "Tên test case",
      "description": "Mô tả test case",
      "given": "Điều kiện ban đầu",
      "when": "Hành động thực hiện",
      "then": "Kết quả mong đợi",
      "priority": "high",
      "type": "happy_path"
    }
  ]
}

Chỉ trả về JSON.`;

  try {
    const responseText = await callCerebrasAPI(prompt);
    const parsed = parseJSONFromResponse(responseText);
    return parsed.testCases || [];
  } catch (error) {
    throw new Error(`Error generating test cases: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Complete analysis pipeline - analyze document and return full analysis
 */
export async function analyzeDocument(documentContent: string): Promise<RequirementAnalysis> {
  // Step 1: Classify requirements
  const { functional, nonFunctional } = await classifyRequirements(documentContent);

  // Step 2: Detect conflicts
  const conflicts = await detectConflicts(functional, nonFunctional);

  // Step 3: Evaluate testability
  const { clarityScores, testabilityScores } = await evaluateTestability(functional, nonFunctional);

  // Update requirements with scores
  const updatedFunctional = functional.map((fr) => ({
    ...fr,
    clarityScore: clarityScores[fr.id] || 0,
    testabilityScore: testabilityScores.find((ts) => ts.requirementId === fr.id)?.score || 0,
  }));

  const updatedNonFunctional = nonFunctional.map((nfr) => ({
    ...nfr,
    clarityScore: clarityScores[nfr.id] || 0,
    testabilityScore: testabilityScores.find((ts) => ts.requirementId === nfr.id)?.score || 0,
  }));

  // Calculate summary
  const totalRequirements = updatedFunctional.length + updatedNonFunctional.length;
  const avgClarityScore =
    totalRequirements > 0
      ? [...updatedFunctional, ...updatedNonFunctional].reduce((sum, req) => sum + req.clarityScore, 0) /
        totalRequirements
      : 0;
  const avgTestabilityScore =
    totalRequirements > 0
      ? [...updatedFunctional, ...updatedNonFunctional].reduce((sum, req) => sum + req.testabilityScore, 0) /
        totalRequirements
      : 0;

  return {
    documentId: `doc_${Date.now()}`,
    analyzedAt: new Date().toISOString(),
    summary: {
      totalRequirements,
      functionalCount: updatedFunctional.length,
      nonFunctionalCount: updatedNonFunctional.length,
      conflictsCount: conflicts.length,
      avgClarityScore: Math.round(avgClarityScore),
      avgTestabilityScore: Math.round(avgTestabilityScore),
    },
    functionalRequirements: updatedFunctional,
    nonFunctionalRequirements: updatedNonFunctional,
    conflicts,
    testabilityScores,
  };
}

