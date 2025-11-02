"""
Testing Agent - Xử lý file kết quả test từ GitHub Actions và các nguồn khác
"""
import json
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Optional
from .base_agent import BaseAgent


class TestingAgent(BaseAgent):
    """Agent chuyên xử lý test results files"""
    
    def __init__(self, api_key: str = None):
        super().__init__("Testing", api_key)
    
    def get_system_prompt(self) -> str:
        return """Bạn là Testing Agent - chuyên gia trong việc xử lý và phân tích file kết quả test.

Nhiệm vụ của bạn:
1. Parse các định dạng test results: JUnit XML, JSON (Playwright, Cypress, Jest), PyTest, Mocha...
2. Extract thông tin quan trọng: test name, status (pass/fail/skip), duration, error messages, stack traces
3. Chuẩn hóa dữ liệu về format thống nhất
4. Validate và kiểm tra tính hợp lệ của file
5. Phân loại test cases theo category (unit, integration, e2e...)

Output format mong muốn:
{
  "total": number,
  "passed": number,
  "failed": number,
  "skipped": number,
  "duration": number (ms),
  "tests": [
    {
      "name": string,
      "status": "pass" | "fail" | "skip",
      "duration": number (ms),
      "error": string (optional),
      "stackTrace": string (optional),
      "category": string (optional)
    }
  ],
  "metadata": {
    "framework": string,
    "timestamp": string,
    "source": string
  }
}"""
    
    def parse_junit_xml(self, xml_content: str) -> Dict[str, Any]:
        """Parse JUnit XML format"""
        try:
            root = ET.fromstring(xml_content)
            tests = []
            total = int(root.attrib.get("tests", 0))
            failures = int(root.attrib.get("failures", 0))
            errors = int(root.attrib.get("errors", 0))
            skipped = int(root.attrib.get("skipped", 0))
            
            for testcase in root.findall(".//testcase"):
                test_name = testcase.attrib.get("name", "")
                classname = testcase.attrib.get("classname", "")
                duration = float(testcase.attrib.get("time", 0)) * 1000  # Convert to ms
                
                # Check status
                status = "pass"
                error = None
                stack_trace = None
                
                failure = testcase.find("failure")
                error_elem = testcase.find("error")
                
                if failure is not None:
                    status = "fail"
                    error = failure.attrib.get("message", "")
                    stack_trace = failure.text
                elif error_elem is not None:
                    status = "fail"
                    error = error_elem.attrib.get("message", "")
                    stack_trace = error_elem.text
                elif testcase.find("skipped") is not None:
                    status = "skip"
                
                tests.append({
                    "name": f"{classname}.{test_name}" if classname else test_name,
                    "status": status,
                    "duration": int(duration),
                    "error": error,
                    "stackTrace": stack_trace,
                    "category": self._detect_category(test_name, classname)
                })
            
            return {
                "total": total,
                "passed": total - failures - errors - skipped,
                "failed": failures + errors,
                "skipped": skipped,
                "duration": int(float(root.attrib.get("time", 0)) * 1000),
                "tests": tests,
                "metadata": {
                    "framework": "JUnit",
                    "timestamp": root.attrib.get("timestamp", ""),
                    "source": "junit_xml"
                }
            }
        except Exception as e:
            return {"error": f"Failed to parse JUnit XML: {str(e)}"}
    
    def parse_json_playwright(self, json_content: Dict[str, Any]) -> Dict[str, Any]:
        """Parse Playwright JSON format"""
        try:
            tests = []
            stats = json_content.get("stats", {})
            
            for suite in json_content.get("suites", []):
                for spec in suite.get("specs", []):
                    for test in spec.get("tests", []):
                        test_name = test.get("title", "")
                        status = "pass"
                        
                        results = test.get("results", [])
                        if results:
                            result = results[0]
                            status_map = {
                                "passed": "pass",
                                "failed": "fail",
                                "skipped": "skip"
                            }
                            status = status_map.get(result.get("status", "unknown"), "pass")
                            duration = result.get("duration", 0)
                            error = None
                            if status == "fail":
                                error_info = result.get("error", {})
                                error = error_info.get("message", "")
                            
                            tests.append({
                                "name": test_name,
                                "status": status,
                                "duration": duration,
                                "error": error,
                                "category": "e2e"
                            })
            
            return {
                "total": stats.get("total", 0),
                "passed": stats.get("expected", 0),
                "failed": stats.get("unexpected", 0),
                "skipped": stats.get("skipped", 0),
                "duration": stats.get("duration", 0),
                "tests": tests,
                "metadata": {
                    "framework": "Playwright",
                    "source": "playwright_json"
                }
            }
        except Exception as e:
            return {"error": f"Failed to parse Playwright JSON: {str(e)}"}
    
    def parse_json_jest(self, json_content: Dict[str, Any]) -> Dict[str, Any]:
        """Parse Jest JSON format"""
        try:
            tests = []
            test_results = json_content.get("testResults", [])
            
            for test_file in test_results:
                for assertion_result in test_file.get("assertionResults", []):
                    status_map = {
                        "passed": "pass",
                        "failed": "fail",
                        "pending": "skip"
                    }
                    status = status_map.get(assertion_result.get("status", "unknown"), "pass")
                    
                    tests.append({
                        "name": assertion_result.get("fullName", ""),
                        "status": status,
                        "duration": assertion_result.get("duration", 0),
                        "error": assertion_result.get("failureMessages", [None])[0],
                        "category": "unit"
                    })
            
            return {
                "total": json_content.get("numTotalTests", 0),
                "passed": json_content.get("numPassedTests", 0),
                "failed": json_content.get("numFailedTests", 0),
                "skipped": json_content.get("numPendingTests", 0),
                "duration": json_content.get("startTime", 0),
                "tests": tests,
                "metadata": {
                    "framework": "Jest",
                    "source": "jest_json"
                }
            }
        except Exception as e:
            return {"error": f"Failed to parse Jest JSON: {str(e)}"}
    
    def detect_format(self, content: str) -> str:
        """Tự động phát hiện format của test result file"""
        content_stripped = content.strip()
        
        # Check XML (JUnit)
        if content_stripped.startswith("<?xml") or content_stripped.startswith("<testsuite"):
            return "junit_xml"
        
        # Check JSON
        if content_stripped.startswith("{") or content_stripped.startswith("["):
            try:
                data = json.loads(content_stripped)
                # Detect specific JSON formats
                if "suites" in data or "specs" in data:
                    return "playwright_json"
                elif "testResults" in data or "numTotalTests" in data:
                    return "jest_json"
                else:
                    return "generic_json"
            except:
                return "unknown"
        
        return "unknown"
    
    def _detect_category(self, test_name: str, classname: str = "") -> str:
        """Phát hiện category của test dựa trên tên"""
        name_lower = (test_name + " " + classname).lower()
        
        if any(keyword in name_lower for keyword in ["integration", "integrationtest"]):
            return "integration"
        elif any(keyword in name_lower for keyword in ["e2e", "endtoend", "playwright", "cypress"]):
            return "e2e"
        elif any(keyword in name_lower for keyword in ["unit", "unittest"]):
            return "unit"
        else:
            return "other"
    
    def process(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Xử lý task - parse test result file
        """
        file_content = task.get("file_content", "")
        file_name = task.get("file_name", "")
        file_format = task.get("format", None)  # Optional: user specified format
        
        if not file_content:
            return {
                "success": False,
                "error": "Không có file content để xử lý"
            }
        
        # Auto-detect format nếu chưa được chỉ định
        if not file_format:
            file_format = self.detect_format(file_content)
        
        result = None
        
        # Parse based on format
        if file_format == "junit_xml":
            result = self.parse_junit_xml(file_content)
        elif file_format == "playwright_json":
            try:
                data = json.loads(file_content)
                result = self.parse_json_playwright(data)
            except:
                result = {"error": "Failed to parse Playwright JSON"}
        elif file_format == "jest_json":
            try:
                data = json.loads(file_content)
                result = self.parse_json_jest(data)
            except:
                result = {"error": "Failed to parse Jest JSON"}
        elif file_format == "generic_json":
            # Use LLM to parse generic JSON
            prompt = f"""Parse test results từ JSON này và extract thông tin test cases:

{file_content[:2000]}  # Limit content để tránh token limit

Trả về JSON với format chuẩn như đã mô tả trong system prompt."""
            llm_result = self.call_llm(prompt)
            try:
                result = json.loads(llm_result)
            except:
                result = {"error": f"LLM parsing failed: {llm_result}"}
        else:
            return {
                "success": False,
                "error": f"Format không được hỗ trợ: {file_format}"
            }
        
        if "error" in result:
            return {
                "success": False,
                "error": result["error"]
            }
        
        return {
            "success": True,
            "parsed_data": result,
            "format_detected": file_format,
            "file_name": file_name
        }

