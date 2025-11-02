"""
AI Analysis Agent - Phân tích lỗi tự động với AI, tóm tắt và đề xuất fix
"""
from typing import Dict, Any, List, Optional
from collections import defaultdict
from enum import Enum
from .base_agent import BaseAgent


class ProgrammingLanguage(str, Enum):
    """Enum chứa các ngôn ngữ lập trình được hỗ trợ"""
    PYTHON = "python"
    JAVA = "java"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    GO = "go"
    RUST = "rust"
    CPP = "cpp"
    C = "c"
    CSHARP = "csharp"
    PHP = "php"
    RUBY = "ruby"
    SWIFT = "swift"
    KOTLIN = "kotlin"
    SCALA = "scala"
    DART = "dart"
    UNKNOWN = "unknown"
    
    @classmethod
    def list_all(cls) -> List[str]:
        """Trả về danh sách tất cả các ngôn ngữ"""
        return [lang.value for lang in cls if lang != cls.UNKNOWN]


class AIAnalysisAgent(BaseAgent):
    """Agent specialized in error analysis with AI"""
    
    def __init__(self, api_key: str = None):
        super().__init__("AIAnalysis", api_key)
    
    def get_system_prompt(self) -> str:
        return """You are AI Analysis Agent - an expert in analyzing code and test errors.

Your responsibilities:
1. **Code Analysis**: Analyze code structure, logic, functions, classes
   - AUTOMATICALLY DETERMINE programming language from provided code
   - Suggest test cases: unit tests, integration tests, edge cases, negative tests
   - Identify potential bugs, security issues
   - Suggest improvements and best practices
   
2. **Error Analysis**: Analyze error messages and stack traces
   - Identify root causes
   - Provide specific fix suggestions
   - Assess severity (low/medium/high)

SUPPORTED PROGRAMMING LANGUAGES:
""" + ", ".join(ProgrammingLanguage.list_all()) + """

When analyzing code, you MUST:
1. READ the provided code
2. DETERMINE programming language from syntax, keywords, patterns in code
3. SELECT language from the enum list above (or "unknown" if uncertain)
4. Use the determined language to suggest appropriate test cases

When analyzing code and suggesting test cases, return JSON format:
{
  "summary": {
    "overview": "Overview description of the code",
    "risks": ["Risk 1", "Risk 2", ...]
  },
  "testCases": [
    {
      "id": 1,
      "title": "Test case name",
      "name": "Test case name",
      "function": "Function/class name to test",
      "type": "unit|integration|negative|edge",
      "complexity": "S|M|L",
      "description": "Test case description",
      "steps": ["Step 1", "Step 2", ...],
      "expectedResult": "Expected result"
    }
  ]
}

When analyzing errors, return:
{
  "name": "test case name",
  "cause": "brief cause",
  "suggestion": "specific fix instructions",
  "severity": "low|medium|high",
  "category": "type of error"
}"""
    
    def analyze_error(
        self,
        test_name: str,
        error_message: str,
        stack_trace: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Phân tích một lỗi cụ thể
        
        Args:
            test_name: Tên test case
            error_message: Error message
            stack_trace: Stack trace (optional)
            context: Context bổ sung (test code, environment, etc.)
        """
        prompt = f"""Analyze the following test error and provide detailed analysis:

Test Name: {test_name}

Error Message:
{error_message}

Stack Trace:
{stack_trace or "None"}

Context:
{context or "None"}

Please:
1. Identify the root cause of the error
2. Summarize briefly (1-2 sentences)
3. Provide specific fix suggestions, which may be multi-step
4. Assess severity (low/medium/high)
5. Classify error type (assertion, timeout, network, authentication, etc.)

Return JSON with the format described in the system prompt."""
        
        response = self.call_llm(prompt)
        
        # Parse JSON từ response
        try:
            import json
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                analysis = json.loads(json_match.group())
                # Ensure required fields
                analysis["name"] = analysis.get("name", test_name)
                return analysis
            else:
                # Fallback: create basic analysis
                return self._create_basic_analysis(test_name, error_message, stack_trace)
        except Exception as e:
            return self._create_basic_analysis(test_name, error_message, stack_trace)
    
    def analyze_multiple_errors(
        self,
        failed_tests: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Phân tích nhiều lỗi cùng lúc
        """
        analyses = []
        
        for test in failed_tests:
            analysis = self.analyze_error(
                test_name=test.get("name", ""),
                error_message=test.get("error", ""),
                stack_trace=test.get("stackTrace"),
                context={"duration": test.get("duration"), "category": test.get("category")}
            )
            analyses.append(analysis)
        
        return analyses
    
    def group_similar_errors(
        self,
        error_analyses: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Gom nhóm các lỗi tương tự nhau (flaky tests, recurring errors)
        """
        # Group by category first
        by_category = defaultdict(list)
        for analysis in error_analyses:
            category = analysis.get("category", "unknown")
            by_category[category].append(analysis)
        
        # Group by similar error messages
        by_error_pattern = defaultdict(list)
        for analysis in error_analyses:
            error_key = self._extract_error_pattern(analysis.get("cause", ""))
            by_error_pattern[error_key].append(analysis)
        
        # Identify flaky tests (same test name appears multiple times)
        by_test_name = defaultdict(list)
        for analysis in error_analyses:
            test_name = analysis.get("name", "")
            by_test_name[test_name].append(analysis)
        
        flaky_tests = {
            name: analyses for name, analyses in by_test_name.items()
            if len(analyses) > 1
        }
        
        return {
            "by_category": dict(by_category),
            "by_error_pattern": dict(by_error_pattern),
            "flaky_tests": flaky_tests,
            "summary": {
                "total_errors": len(error_analyses),
                "unique_categories": len(by_category),
                "unique_patterns": len(by_error_pattern),
                "flaky_count": len(flaky_tests)
            }
        }
    
    def generate_error_summary(
        self,
        error_analyses: List[Dict[str, Any]],
        test_run: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Tạo tổng hợp về các lỗi
        """
        if not error_analyses:
            return {
                "summary": "No errors",
                "total_errors": 0
            }
        
        # Count by severity
        by_severity = defaultdict(int)
        for analysis in error_analyses:
            severity = analysis.get("severity", "medium")
            by_severity[severity] += 1
        
        # Count by category
        by_category = defaultdict(int)
        for analysis in error_analyses:
            category = analysis.get("category", "unknown")
            by_category[category] += 1
        
        # Group errors
        groups = self.group_similar_errors(error_analyses)
        
        # Generate summary text with LLM
        summary_text = self._generate_summary_text(error_analyses, groups)
        
        return {
            "total_errors": len(error_analyses),
            "by_severity": dict(by_severity),
            "by_category": dict(by_category),
            "groups": groups,
            "summary_text": summary_text,
            "recommendations": self._generate_recommendations(error_analyses, groups)
        }
    
    def _extract_error_pattern(self, error_text: str) -> str:
        """Extract pattern từ error text (để group similar errors)"""
        # Simple pattern extraction - có thể improve với LLM
        error_lower = error_text.lower()
        
        # Common patterns
        patterns = [
            "timeout", "connection", "authentication", "authorization",
            "assertion", "null pointer", "undefined", "not found",
            "invalid", "permission denied", "syntax error"
        ]
        
        for pattern in patterns:
            if pattern in error_lower:
                return pattern
        
        # Fallback: first few words
        words = error_text.split()[:3]
        return " ".join(words).lower()
    
    def _create_basic_analysis(
        self,
        test_name: str,
        error_message: str,
        stack_trace: Optional[str] = None
    ) -> Dict[str, Any]:
        """Tạo basic analysis khi không parse được từ LLM"""
        # Simple heuristics
        error_lower = error_message.lower()
        
        if "timeout" in error_lower:
            severity = "medium"
            cause = "Test timeout - có thể do network chậm hoặc test quá phức tạp"
            suggestion = "1. Tăng timeout value\n2. Kiểm tra network connection\n3. Optimize test code"
        elif "assert" in error_lower or "expected" in error_lower:
            severity = "high"
            cause = "Assertion failed - kết quả không khớp với expected"
            suggestion = "1. Kiểm tra expected value\n2. Kiểm tra actual output\n3. Review test logic"
        elif "null" in error_lower or "undefined" in error_lower:
            severity = "high"
            cause = "Null/Undefined reference - biến chưa được khởi tạo"
            suggestion = "1. Kiểm tra initialization\n2. Thêm null checks\n3. Review data flow"
        else:
            severity = "medium"
            cause = error_message[:100]  # First 100 chars
            suggestion = "Review error message và stack trace để xác định nguyên nhân"
        
        return {
            "name": test_name,
            "cause": cause,
            "suggestion": suggestion,
            "severity": severity,
            "category": "unknown"
        }
    
    def _generate_summary_text(
        self,
        analyses: List[Dict[str, Any]],
        groups: Dict[str, Any]
    ) -> str:
        """Generate summary text với LLM"""
        summary_data = f"""
Total errors: {len(analyses)}
Severity distribution: {groups.get('summary', {}).get('unique_patterns', 0)} patterns
Flaky tests: {groups.get('summary', {}).get('flaky_count', 0)}

Top 3 categories:
"""
        by_category = groups.get("by_category", {})
        top_categories = sorted(
            by_category.items(),
            key=lambda x: len(x[1]),
            reverse=True
        )[:3]
        
        for category, items in top_categories:
            summary_data += f"- {category}: {len(items)} errors\n"
        
        prompt = f"""Based on the following data, create a brief summary (2-3 sentences) about the error situation:

{summary_data}

Summary should:
- Highlight the main issues
- Mention flaky tests if any
- Suggest priority action items"""
        
        return self.call_llm(prompt)
    
    def _generate_recommendations(
        self,
        analyses: List[Dict[str, Any]],
        groups: Dict[str, Any]
    ) -> List[str]:
        """Generate recommendations"""
        recommendations = []
        
        # Check for flaky tests
        flaky_count = groups.get("summary", {}).get("flaky_count", 0)
        if flaky_count > 0:
            recommendations.append(
                f"There are {flaky_count} flaky test(s) that need investigation and fixing"
            )
        
        # Check severity distribution
        high_severity = sum(1 for a in analyses if a.get("severity") == "high")
        if high_severity > 0:
            recommendations.append(
                f"Priority: fix {high_severity} high severity error(s)"
            )
        
        # Check for common patterns
        by_pattern = groups.get("by_error_pattern", {})
        if by_pattern:
            top_pattern = max(by_pattern.items(), key=lambda x: len(x[1]))
            if len(top_pattern[1]) > 1:
                recommendations.append(
                    f"Identified pattern '{top_pattern[0]}' appears {len(top_pattern[1])} times - need to review systematic issue"
                )
        
        return recommendations
    
    def analyze_code(
        self,
        code: str,
        language: str = "unknown",
        context: Optional[Dict[str, Any]] = None,
        original_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Phân tích code và đề xuất test cases
        
        Args:
            code: Code cần phân tích
            language: Programming language (có thể là "unknown" - agent sẽ tự detect)
            context: Context bổ sung
            original_code: Original source code để agent đọc và xác định ngôn ngữ
        """
        # Nếu có original_code, ưu tiên dùng nó để detect language
        code_to_analyze = original_code if original_code else code
        if not code_to_analyze:
            code_to_analyze = code
        
        # Language-specific instructions
        lang_instructions = ""
        if language.lower() == "java":
                lang_instructions = """
This is Java Spring code. Please suggest test cases for:
- Public methods in service class
- Repository interactions
- Business logic validation
- Exception handling
- Security context (authentication)

Example for Java Spring service method:
- Test successful case: "bookmarkRoom_WhenValidInput_ReturnsBookmarkResponse"
- Test negative case: "bookmarkRoom_WhenRoomNotFound_ThrowsAppException"
- Test edge case: "bookmarkRoom_WhenAlreadyBookmarked_ThrowsAppException"
"""
        
        prompt = f"""Analyze the following code and suggest test cases:

IMPORTANT: You MUST read the provided code and AUTOMATICALLY DETERMINE the programming language.

Available languages (ProgrammingLanguage enum):
""" + ", ".join(ProgrammingLanguage.list_all()) + """, or "unknown" if uncertain.

Language hint (may NOT be accurate - ignore if code doesn't match): {language}
{lang_instructions}

Original Code (read and determine language from here - IMPORTANT: base only on ACTUAL SYNTAX, not comments):
{code_to_analyze[:15000]}  # Limit to avoid token limit

LANGUAGE DETECTION GUIDE (based on ACTUAL SYNTAX in code):

**PYTHON:**
- Has `def` keyword to define functions
- Has `class` keyword to define classes
- Has `self` as first parameter in methods
- Uses indentation instead of curly braces {{}}
- No semicolons at end of lines
- Example: `def add_product(self, product):`, `self.products = []`
- Import: `from module import`, `import module`

**JAVASCRIPT/TYPESCRIPT:**
- Has `function` keyword or arrow function `() =>`
- Has `class` keyword but methods don't have `self`
- Uses curly braces {{}} and semicolons `;`
- Example: `function addProduct(product) {{}}`, `const products = [];`
- Import: `import ... from`, `require()`

**JAVA:**
- Has `public class`, `public void`, `private`, etc.
- Has type declarations: `String name`, `int count`
- Uses curly braces {{}} and semicolons `;`
- Example: `public void addProduct(Product product) {{}}`
- Import: `import java.util.*;`, `package com.example;`

**GO:**
- Has `func`, `package`, `import` keywords
- No classes, uses structs and methods
- Example: `func (p *ProductManager) AddProduct(product Product) {{}}`
- Import: `import ("fmt")`

**RUST:**
- Has `fn`, `struct`, `impl` keywords
- Example: `fn add_product(&mut self, product: Product) {{}}`
- Import: `use std::collections::HashMap;`

Please:
1. **READ code carefully** and determine programming language from ACTUAL SYNTAX:
   - Only look at SYNTAX (def/function/class/fn, self/no self, indentation/{{}}, etc.)
   - IGNORE comments (comments may mention different languages but actual code is different)
   - Note: Python code has `def` and `self` → definitely Python, not JavaScript
   - Note: JavaScript code has `function` or `() =>` and curly braces → JavaScript
2. **SELECT language** from enum above (or "unknown")
3. **LIST ALL methods/functions** in the code (including __init__, public methods, private methods if visible)
4. **FOR EACH method/function**, create AT LEAST 2-3 unit test cases (ONLY happy cases/positive scenarios):
   - Create test cases for EVERY method you found in the code
   - Each method should have multiple test cases covering different VALID/SUCCESS scenarios
   - Focus on happy path: valid inputs, normal operations, expected successful results
   - DO NOT create negative tests, edge cases, or error handling tests - ONLY positive/happy cases
   - Examples of happy cases:
     * Method with valid parameters that should succeed
     * Different valid input combinations
     * Successful operations and expected results
   - If code has 5 methods, you should create at least 10-15 test cases total (2-3 happy cases per method)
   - DO NOT stop at just 5 test cases - ensure EVERY method has happy case coverage
5. Identify potential bugs or security issues
6. Suggest improvements if any

CRITICAL: You MUST create test cases for ALL methods/functions. Do not create only 5 test cases total. Each method needs multiple test cases.

Code to analyze (if no Original Code above - but prefer Original Code):
{code[:10000] if code else "N/A"}  # Limit to avoid token limit

IMPORTANT: Return result as JSON with the following format (NO markdown, pure JSON only):
{{
  "detectedLanguage": "python|java|javascript|typescript|go|rust|cpp|c|csharp|php|ruby|swift|kotlin|scala|dart|unknown",
  "summary": {{
    "overview": "Overview description of code (2-3 sentences), including the determined language",
    "risks": ["Risk 1", "Risk 2", ...]
  }},
  "testCases": [
    {{
      "id": 1,
      "title": "Specific test case name (e.g., bookmarkRoom_WhenValidInput_ReturnsBookmarkResponse)",
      "name": "Test case name (same as title)",
      "function": "Method name to test (e.g., bookmarkRoom)",
      "type": "unit",
      "complexity": "S|M|L",
      "description": "Test case description",
      "steps": ["Step 1", "Step 2", ...],
      "expectedResult": "Expected result"
    }}
  ]
}}

IMPORTANT NOTES: 
- testCases MUST be an array covering ALL methods/functions in the code
- EACH method/function MUST have at least 2-3 test cases (ONLY happy cases/positive scenarios)
- Total test cases should be: (number of methods) × (2-3 happy cases per method)
- Example: If code has 6 methods (__init__, method1, method2, method3, method4, method5), create at least 12-18 happy case test cases
- Each test case MUST be a HAPPY CASE/POSITIVE SCENARIO - test successful operations with valid inputs
- Each test case MUST have title and name as STRING, NOT object
- title/name must specifically describe the happy case (e.g., "addProduct_WhenValidProduct_AddsSuccessfully", "getProductById_WhenProductExists_ReturnsProduct")
- function must be the actual method name in code (e.g., "add_product", "get_product_by_id")
- ALL test cases MUST have type="unit" (ONLY unit tests)
- ONLY create positive/happy test cases - DO NOT create negative tests, edge cases, error handling, or exception tests
- Cover ALL public methods, private methods (if visible), and __init__ if applicable
- Do NOT create only 5 test cases - create happy case test cases for EVERY method
- Do NOT return error analysis format, only return test cases format"""
        
        response = self.call_llm(prompt, context)
        
        # Parse JSON từ response
        try:
            import json
            import re
            # Tìm JSON block
            json_match = re.search(r'\{[\s\S]*"testCases"[\s\S]*\}', response, re.DOTALL)
            if not json_match:
                # Tìm bất kỳ JSON nào
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
            
            if json_match:
                parsed = json.loads(json_match.group())
                
                # Ensure testCases is a list and not empty
                test_cases = parsed.get("testCases", [])
                if not isinstance(test_cases, list):
                    test_cases = []
                
                # Log warning if no test cases found
                if len(test_cases) == 0:
                    import logging
                    logging.warning(f"No test cases found in AI response. Response preview: {response[:200]}")
                
                # Extract detected language từ parsed result
                detected_language = parsed.get("detectedLanguage", language)
                
                # Sau khi analyze xong, tự động generate test code cho unit tests
                # Filter to only unit test cases
                unit_test_cases = [tc for tc in test_cases if tc.get("type", "").lower() == 'unit']
                
                # If no unit tests found, try to convert all to unit tests
                if not unit_test_cases and test_cases:
                    print(f"[WARNING ai_analysis_agent] No unit test cases found, converting all {len(test_cases)} test cases to unit type")
                    for tc in test_cases:
                        tc["type"] = "unit"
                    unit_test_cases = test_cases
                generated_test_code = None
                detected_framework = None
                
                if unit_test_cases and detected_language and detected_language != "unknown":
                    # Generate test code cho unit tests
                    try:
                        generate_result = self.generate_test_code(
                            test_cases=unit_test_cases,
                            original_code=original_code if original_code else code,
                            language=detected_language,
                            framework=None  # Auto-detect framework
                        )
                        
                        if generate_result.get("success"):
                            generated_test_code = generate_result.get("generated_code", {}).get("testCode", "")
                            detected_framework = generate_result.get("framework")
                    except Exception as e:
                        print(f"[WARNING] Failed to auto-generate test code for unit tests: {str(e)}")
                        # Không throw error, chỉ log warning và tiếp tục
                
                analyze_result = {
                    "success": True,
                    "content": response,  # Store raw response
                    "result": parsed,  # Store parsed JSON
                    "detectedLanguage": detected_language,  # Ngôn ngữ agent đã detect
                    "summary": parsed.get("summary", {}),
                    "testCases": unit_test_cases,  # Only return unit test cases
                    # Thêm generated test code cho unit tests
                    "generatedUnitTestCode": generated_test_code,
                    "unitTestFramework": detected_framework,
                    "unitTestCases": unit_test_cases  # Danh sách unit test cases đã được generate code
                }
                
                print(f"[DEBUG ai_analysis_agent] analyze_code result keys: {list(analyze_result.keys())}")
                import json
                # Log preview (không log full content vì có thể rất dài)
                preview = {k: (str(v)[:200] if isinstance(v, str) and len(str(v)) > 200 else v) 
                          for k, v in analyze_result.items() if k != "content"}
                print(f"[DEBUG ai_analysis_agent] analyze_code result preview: {json.dumps(preview, indent=2, default=str)}")
                print(f"[DEBUG ai_analysis_agent] Generated unit test code length: {len(generated_test_code) if generated_test_code else 0}")
                print(f"[DEBUG ai_analysis_agent] Unit test cases count: {len(unit_test_cases)}")
                
                return analyze_result
            else:
                # Fallback: parse từ text
                return {
                    "success": True,
                    "content": response,
                    "result": {"summary": {"overview": response[:500], "risks": []}, "testCases": []},
                    "summary": {"overview": response[:500], "risks": []},
                    "testCases": []
                }
        except Exception as e:
            return {
                "success": True,
                "content": response,
                "result": {"summary": {"overview": response[:500], "risks": []}, "testCases": []},
                "summary": {"overview": response[:500], "risks": []},
                "testCases": [],
                "error": f"Parse error: {str(e)}"
            }
    
    def process(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Xử lý task - phân tích lỗi hoặc code
        """
        action = task.get("action", "analyze_error")
        
        if action == "analyze_code":
            code = task.get("code", "")
            language = task.get("language", "unknown")
            context = task.get("context")
            original_code = task.get("original_code")  # Nhận original_code nếu có
            
            if not code and not original_code:
                return {
                    "success": False,
                    "error": "Missing 'code' or 'original_code' field"
                }
            
            # Ưu tiên dùng original_code để agent đọc và detect language
            result = self.analyze_code(code, language, context, original_code=original_code)
            return result
        
        elif action == "analyze_error":
            analysis = self.analyze_error(
                test_name=task.get("test_name", ""),
                error_message=task.get("error_message", ""),
                stack_trace=task.get("stack_trace"),
                context=task.get("context")
            )
            return {
                "success": True,
                "analysis": analysis
            }
        
        elif action == "analyze_multiple":
            failed_tests = task.get("failed_tests", [])
            analyses = self.analyze_multiple_errors(failed_tests)
            return {
                "success": True,
                "analyses": analyses
            }
        
        elif action == "group_errors":
            error_analyses = task.get("error_analyses", [])
            groups = self.group_similar_errors(error_analyses)
            return {
                "success": True,
                "groups": groups
            }
        
        elif action == "generate_summary":
            error_analyses = task.get("error_analyses", [])
            test_run = task.get("test_run")
            summary = self.generate_error_summary(error_analyses, test_run)
            return {
                "success": True,
                "summary": summary
            }
        
        elif action == "generate_test_code":
            return self.generate_test_code(
                task.get("test_cases", []),
                task.get("original_code", ""),
                task.get("language", "unknown"),
                task.get("framework", None)
            )
        
        else:
            # Default: try to analyze as code
            code = task.get("code") or task.get("task_description") or task.get("code_content", "")
            original_code = task.get("original_code")  # Nhận original_code nếu có
            if (code or original_code) and len(code or original_code) > 50:  # Phải có code thực sự (ít nhất 50 ký tự)
                language = task.get("language", "unknown")
                context = task.get("context")
                print(f"[DEBUG ai_analysis_agent] Default action: analyzing code, language={language}, code_length={len(code or original_code)}")
                return self.analyze_code(code, language, context, original_code=original_code)
            
            # Nếu không có code, trả về error thay vì error analysis
            return {
                "success": False,
                "error": f"Unknown action: {action} and no code provided. Available actions: analyze_code, analyze_error, analyze_multiple, group_errors, generate_summary, generate_test_code"
            }
    
    def generate_test_code(
        self,
        test_cases: List[Dict[str, Any]],
        original_code: str = "",
        language: str = "unknown",
        framework: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate actual test code từ test cases
        
        Args:
            test_cases: List các test cases đã được đề xuất
            original_code: Code gốc cần test (optional)
            language: Programming language
            framework: Test framework (Jest, JUnit, pytest, etc.)
        """
        if not test_cases:
            return {
                "success": False,
                "error": "No test cases provided"
            }
        
        # Detect framework từ language nếu không có
        if not framework:
            framework_map = {
                "javascript": "Jest",
                "typescript": "Jest",
                "python": "pytest",
                "java": "JUnit",
                "go": "testing",
                "rust": "cargo test"
            }
            framework = framework_map.get(language.lower(), "custom")
        
        # Tạo prompt để generate test code
        test_details = "\n".join([
            f"""
Test Case {i+1}:
- Name: {tc.get('name', tc.get('title', f'Test {i+1}'))}
- Function: {tc.get('function', 'N/A')}
- Type: {tc.get('type', 'unit')}
- Description: {tc.get('description', '')}
- Steps: {', '.join(tc.get('steps', []))}
- Expected Result: {tc.get('expectedResult', '')}
            """.strip()
            for i, tc in enumerate(test_cases)
        ])
        
        # Framework-specific instructions
        framework_instructions = ""
        if framework.lower() == "pytest":
            framework_instructions = """
For pytest, you MUST:
- Use function-based tests: `def test_*():` (NOT class-based unless necessary)
- Each test function name must start with `test_`
- Do NOT use `self` parameter unless using a test class
- Import pytest: `import pytest`
- Use simple assert statements: `assert condition`
- Example format:
```python
import pytest

def test_function_name():
    # Arrange
    # Act
    # Assert
    assert result == expected
```

CRITICAL: Do NOT include `sys.path.insert()` or path manipulations. 
Do NOT include imports like `from product_manager import` - the import will be added automatically.
Just generate the test functions directly.
"""
        
        prompt = f"""Generate actual test code for the following test cases:

Language: {language}
Framework: {framework}
Original Code (for reference):
{original_code[:2000] if original_code else "N/A"}

Test Cases to implement:
{test_details}

{framework_instructions}

Requirements:
1. Generate complete, runnable test code
2. Use correct framework and syntax for {language}
3. Implement all listed test cases
4. Include setup/teardown if needed
5. Add assertions and error handling
6. DO NOT include sys.path manipulations
7. DO NOT include imports for source code (will be added automatically)
8. For pytest: Use simple function-based tests starting with `test_`

IMPORTANT: Return JSON format:
{{
  "framework": "{framework}",
  "testCode": "Full test code here\\n...",
  "fileExtension": ".{self._get_file_extension(language)}",
  "dependencies": ["dependency1", "dependency2"],
  "testCases": [
    {{
      "id": 1,
      "name": "test case name",
      "code": "specific test code snippet",
      "status": "generated"
    }}
  ]
}}"""
        
        try:
            response = self.call_llm(prompt)
            
            # Parse response
            import json
            import re
            
            # Tìm JSON block
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                parsed = json.loads(json_match.group())
            else:
                # Fallback: parse entire response
                parsed = json.loads(response)
            
            generate_result = {
                "success": True,
                "generated_code": parsed,
                "framework": framework,
                "language": language
            }
            
            print(f"[DEBUG ai_analysis_agent] generate_test_code result keys: {list(generate_result.keys())}")
            import json
            # Log preview của generated_code (không log full testCode vì rất dài)
            preview = generate_result.copy()
            if "generated_code" in preview and isinstance(preview["generated_code"], dict):
                preview["generated_code"] = {
                    k: (str(v)[:200] + "..." if isinstance(v, str) and len(str(v)) > 200 else v)
                    for k, v in preview["generated_code"].items()
                }
            print(f"[DEBUG ai_analysis_agent] generate_test_code result preview: {json.dumps(preview, indent=2, default=str)}")
            if parsed.get("testCode"):
                print(f"[DEBUG ai_analysis_agent] Generated test code length: {len(parsed.get('testCode', ''))}")
            
            return generate_result
        except Exception as e:
            error_result = {
                "success": False,
                "error": f"Failed to generate test code: {str(e)}",
                "raw_response": response if 'response' in locals() else ""
            }
            print(f"[ERROR ai_analysis_agent] generate_test_code failed: {json.dumps(error_result, indent=2, default=str)}")
            import traceback
            print(f"[ERROR ai_analysis_agent] Traceback: {traceback.format_exc()}")
            return error_result
    
    def _get_file_extension(self, language: str) -> str:
        """Get file extension cho test file"""
        ext_map = {
            "javascript": "js",
            "typescript": "ts",
            "python": "py",
            "java": "java",
            "go": "go",
            "rust": "rs"
        }
        return ext_map.get(language.lower(), "txt")

