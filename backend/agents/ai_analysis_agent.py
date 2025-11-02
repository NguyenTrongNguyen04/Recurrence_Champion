"""
AI Analysis Agent - Phân tích lỗi tự động với AI, tóm tắt và đề xuất fix
"""
from typing import Dict, Any, List, Optional
from collections import defaultdict
from .base_agent import BaseAgent


class AIAnalysisAgent(BaseAgent):
    """Agent chuyên phân tích lỗi với AI"""
    
    def __init__(self, api_key: str = None):
        super().__init__("AIAnalysis", api_key)
    
    def get_system_prompt(self) -> str:
        return """Bạn là AI Analysis Agent - chuyên gia phân tích code và test errors.

Nhiệm vụ của bạn:
1. **Phân tích code**: Phân tích cấu trúc code, logic, functions, classes
   - Đề xuất test cases: unit tests, integration tests, edge cases, negative tests
   - Xác định potential bugs, security issues
   - Đề xuất improvements và best practices
   
2. **Phân tích errors**: Phân tích error messages và stack traces
   - Xác định nguyên nhân gốc rễ (root cause)
   - Đưa ra gợi ý fix cụ thể
   - Đánh giá severity (low/medium/high)

Khi phân tích code và đề xuất test cases, trả về JSON format:
{
  "summary": {
    "overview": "Mô tả tổng quan về code",
    "risks": ["Risk 1", "Risk 2", ...]
  },
  "testCases": [
    {
      "id": 1,
      "title": "Tên test case",
      "name": "Test case name",
      "function": "Tên function/class cần test",
      "type": "unit|integration|negative|edge",
      "complexity": "S|M|L",
      "description": "Mô tả test case",
      "steps": ["Bước 1", "Bước 2", ...],
      "expectedResult": "Kết quả mong đợi"
    }
  ]
}

Khi phân tích errors, trả về:
{
  "name": "test case name",
  "cause": "nguyên nhân ngắn gọn",
  "suggestion": "hướng dẫn fix cụ thể",
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
        prompt = f"""Phân tích lỗi test sau và đưa ra phân tích chi tiết:

Test Name: {test_name}

Error Message:
{error_message}

Stack Trace:
{stack_trace or "Không có"}

Context:
{context or "Không có"}

Hãy:
1. Xác định nguyên nhân gốc rễ của lỗi
2. Tóm tắt ngắn gọn (1-2 câu)
3. Đưa ra gợi ý fix cụ thể, có thể là nhiều bước
4. Đánh giá severity (low/medium/high)
5. Phân loại loại lỗi (assertion, timeout, network, authentication, etc.)

Trả về JSON với format đã mô tả trong system prompt."""
        
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
                "summary": "Không có lỗi",
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
Tổng số lỗi: {len(analyses)}
Phân bố theo severity: {groups.get('summary', {}).get('unique_patterns', 0)} patterns
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
        
        prompt = f"""Dựa trên dữ liệu sau, tạo một đoạn tóm tắt ngắn gọn (2-3 câu) về tình trạng lỗi:

{summary_data}

Tóm tắt cần:
- Highlight vấn đề chính
- Đề cập đến flaky tests nếu có
- Gợi ý action items cần ưu tiên"""
        
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
                f"Có {flaky_count} flaky test(s) cần được điều tra và fix"
            )
        
        # Check severity distribution
        high_severity = sum(1 for a in analyses if a.get("severity") == "high")
        if high_severity > 0:
            recommendations.append(
                f"Ưu tiên fix {high_severity} high severity error(s)"
            )
        
        # Check for common patterns
        by_pattern = groups.get("by_error_pattern", {})
        if by_pattern:
            top_pattern = max(by_pattern.items(), key=lambda x: len(x[1]))
            if len(top_pattern[1]) > 1:
                recommendations.append(
                    f"Nhận diện pattern '{top_pattern[0]}' xuất hiện {len(top_pattern[1])} lần - cần review systematic issue"
                )
        
        return recommendations
    
    def analyze_code(
        self,
        code: str,
        language: str = "unknown",
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Phân tích code và đề xuất test cases
        
        Args:
            code: Code cần phân tích
            language: Programming language
            context: Context bổ sung
        """
        # Language-specific instructions
        lang_instructions = ""
        if language.lower() == "java":
            lang_instructions = """
Đây là Java Spring code. Hãy đề xuất test cases cho:
- Public methods trong service class
- Repository interactions
- Business logic validation
- Exception handling
- Security context (authentication)

Ví dụ cho Java Spring service method:
- Test successful case: "bookmarkRoom_WhenValidInput_ReturnsBookmarkResponse"
- Test negative case: "bookmarkRoom_WhenRoomNotFound_ThrowsAppException"
- Test edge case: "bookmarkRoom_WhenAlreadyBookmarked_ThrowsAppException"
"""
        
        prompt = f"""Phân tích đoạn code sau và đề xuất test cases:

Language: {language}
{lang_instructions}

Code:
{code[:10000]}  # Limit để tránh token limit

Hãy:
1. Phân tích từng public method trong code
2. Đề xuất test cases CỤ THỂ cho từng method: unit tests, integration tests, edge cases, negative tests
3. Xác định potential bugs hoặc security issues
4. Đề xuất improvements nếu có

QUAN TRỌNG: Trả về kết quả dưới dạng JSON với format sau (KHÔNG có markdown, chỉ JSON thuần):
{{
  "summary": {{
    "overview": "Mô tả tổng quan về code (2-3 câu)",
    "risks": ["Risk 1", "Risk 2", ...]
  }},
  "testCases": [
    {{
      "id": 1,
      "title": "Tên test case cụ thể (ví dụ: bookmarkRoom_WhenValidInput_ReturnsBookmarkResponse)",
      "name": "Tên test case (cùng với title)",
      "function": "Tên method cần test (ví dụ: bookmarkRoom)",
      "type": "unit|integration|negative|edge",
      "complexity": "S|M|L",
      "description": "Mô tả test case",
      "steps": ["Bước 1", "Bước 2", ...],
      "expectedResult": "Kết quả mong đợi"
    }}
  ]
}}

Lưu ý QUAN TRỌNG: 
- testCases PHẢI là array với ít nhất 3-5 test cases
- Mỗi test case PHẢI có title và name là STRING, KHÔNG phải object
- title/name phải mô tả cụ thể test case (ví dụ: "bookmarkRoom_WhenRoomNotFound_ThrowsException")
- function phải là tên method thực tế trong code (ví dụ: "bookmarkRoom", "unbookmarkRoom")
- Ưu tiên test cases cho tất cả public methods trong code
- KHÔNG trả về error analysis format, chỉ trả về test cases format"""
        
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
                
                return {
                    "success": True,
                    "content": response,  # Store raw response
                    "result": parsed,  # Store parsed JSON
                    "summary": parsed.get("summary", {}),
                    "testCases": test_cases
                }
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
            
            if not code:
                return {
                    "success": False,
                    "error": "Missing 'code' field"
                }
            
            result = self.analyze_code(code, language, context)
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
            if code and len(code) > 50:  # Phải có code thực sự (ít nhất 50 ký tự)
                language = task.get("language", "unknown")
                context = task.get("context")
                print(f"[DEBUG ai_analysis_agent] Default action: analyzing code, language={language}, code_length={len(code)}")
                return self.analyze_code(code, language, context)
            
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
        
        prompt = f"""Generate actual test code cho các test cases sau:

Language: {language}
Framework: {framework}
Original Code (for reference):
{original_code[:2000] if original_code else "N/A"}

Test Cases to implement:
{test_details}

Yêu cầu:
1. Generate test code hoàn chỉnh, có thể chạy được
2. Sử dụng đúng framework và syntax cho {language}
3. Implement đầy đủ các test cases đã liệt kê
4. Bao gồm setup/teardown nếu cần
5. Add assertions và error handling

QUAN TRỌNG: Trả về JSON format:
{{
  "framework": "{framework}",
  "testCode": "// Full test code here\\n...",
  "fileExtension": ".{self._get_file_extension(language)}",
  "dependencies": ["dependency1", "dependency2"],
  "testCases": [
    {{
      "id": 1,
      "name": "test case name",
      "code": "// specific test code snippet",
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
            
            return {
                "success": True,
                "generated_code": parsed,
                "framework": framework,
                "language": language
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to generate test code: {str(e)}",
                "raw_response": response if 'response' in locals() else ""
            }
    
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

