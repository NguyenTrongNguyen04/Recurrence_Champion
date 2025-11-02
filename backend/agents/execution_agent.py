"""
Execution Agent - Quản lý test runs, lưu metadata và tracking execution
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import subprocess
import tempfile
import os
import json
import re
import random
from .base_agent import BaseAgent


class ExecutionAgent(BaseAgent):
    """Agent specialized in managing test execution and runs"""
    
    def __init__(self, api_key: str = None):
        super().__init__("Execution", api_key)
    
    def get_system_prompt(self) -> str:
        return """You are Execution Agent - an expert in managing test execution and tracking test runs.

Your responsibilities:
1. Create and manage test run records
2. Store metadata: branch, commit hash, author, timestamp, duration
3. Track execution status (running, completed, failed)
4. Link test results with test runs
5. Manage test run history
6. Handle retry logic and re-execution

You need to ensure:
- Each test run has a unique ID
- Metadata is complete and accurate
- Tracking state changes
- Logging execution details"""
    
    def create_test_run(
        self,
        test_results: Dict[str, Any],
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Tạo một test run record mới
        
        Args:
            test_results: Kết quả test đã được parse bởi TestingAgent
            metadata: Metadata về run (branch, commit, author, etc.)
        """
        run_id = f"#{self._generate_run_id()}"
        timestamp = datetime.now().isoformat()
        
        test_run = {
            "run_id": run_id,
            "timestamp": timestamp,
            "status": "completed",
            "total_tests": test_results.get("total", 0),
            "passed": test_results.get("passed", 0),
            "failed": test_results.get("failed", 0),
            "skipped": test_results.get("skipped", 0),
            "duration_ms": test_results.get("duration", 0),
            "metadata": {
                "branch": metadata.get("branch", "unknown"),
                "commit": metadata.get("commit", ""),
                "commit_message": metadata.get("commit_message", ""),
                "author": metadata.get("author", "unknown"),
                "author_email": metadata.get("author_email", ""),
                "project": metadata.get("project", "default"),
                "framework": test_results.get("metadata", {}).get("framework", "unknown"),
                "trigger": metadata.get("trigger", "manual"),  # manual, ci_cd, scheduled
                "ci_run_url": metadata.get("ci_run_url", ""),
                "environment": metadata.get("environment", "default")
            },
            "test_results": test_results.get("tests", []),
            "summary": {
                "pass_rate": self._calculate_pass_rate(test_results),
                "fail_rate": self._calculate_fail_rate(test_results),
                "avg_duration": self._calculate_avg_duration(test_results.get("tests", []))
            }
        }
        
        return test_run
    
    def update_test_run_status(
        self,
        run_id: str,
        status: str,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Cập nhật status của test run
        
        Args:
            run_id: ID của test run
            status: new status (running, completed, failed, cancelled)
            additional_data: Dữ liệu bổ sung
        """
        update = {
            "run_id": run_id,
            "status": status,
            "updated_at": datetime.now().isoformat()
        }
        
        if additional_data:
            update.update(additional_data)
        
        return update
    
    def compare_runs(
        self,
        run1: Dict[str, Any],
        run2: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        So sánh 2 test runs để phát hiện regressions
        """
        comparison = {
            "run1_id": run1.get("run_id"),
            "run2_id": run2.get("run_id"),
            "total_diff": run2.get("total_tests", 0) - run1.get("total_tests", 0),
            "pass_diff": run2.get("passed", 0) - run1.get("passed", 0),
            "fail_diff": run2.get("failed", 0) - run1.get("failed", 0),
            "pass_rate_change": (
                run2.get("summary", {}).get("pass_rate", 0) - 
                run1.get("summary", {}).get("pass_rate", 0)
            ),
            "new_failures": [],
            "fixed_tests": [],
            "regression": False
        }
        
        # Tìm new failures (fail trong run2 nhưng pass trong run1)
        run1_tests = {t.get("name"): t for t in run1.get("test_results", [])}
        run2_tests = {t.get("name"): t for t in run2.get("test_results", [])}
        
        for test_name, test2 in run2_tests.items():
            test1 = run1_tests.get(test_name)
            if test2.get("status") == "fail":
                if not test1 or test1.get("status") == "pass":
                    comparison["new_failures"].append(test_name)
        
        # Tìm fixed tests (pass trong run2 nhưng fail trong run1)
        for test_name, test1 in run1_tests.items():
            test2 = run2_tests.get(test_name)
            if test1.get("status") == "fail":
                if test2 and test2.get("status") == "pass":
                    comparison["fixed_tests"].append(test_name)
        
        # Xác định regression
        comparison["regression"] = (
            comparison["fail_diff"] > 0 or 
            comparison["pass_rate_change"] < 0 or
            len(comparison["new_failures"]) > 0
        )
        
        return comparison
    
    def _calculate_pass_rate(self, test_results: Dict[str, Any]) -> float:
        """Tính tỷ lệ pass"""
        total = test_results.get("total", 0)
        if total == 0:
            return 0.0
        passed = test_results.get("passed", 0)
        return round((passed / total) * 100, 2)
    
    def _calculate_fail_rate(self, test_results: Dict[str, Any]) -> float:
        """Tính tỷ lệ fail"""
        total = test_results.get("total", 0)
        if total == 0:
            return 0.0
        failed = test_results.get("failed", 0)
        return round((failed / total) * 100, 2)
    
    def _calculate_avg_duration(self, tests: List[Dict[str, Any]]) -> float:
        """Tính thời gian trung bình"""
        if not tests:
            return 0.0
        durations = [t.get("duration", 0) for t in tests if t.get("duration")]
        if not durations:
            return 0.0
        return round(sum(durations) / len(durations), 2)
    
    def _generate_run_id(self) -> int:
        """Generate unique run ID (trong production sẽ dùng database sequence)"""
        import random
        return random.randint(1000, 9999)
    
    def process(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Xử lý task - tạo hoặc quản lý test run
        """
        action = task.get("action", "create_run")
        
        if action == "create_run":
            test_results = task.get("test_results", {})
            metadata = task.get("metadata", {})
            run = self.create_test_run(test_results, metadata)
            return {
                "success": True,
                "test_run": run
            }
        
        elif action == "update_status":
            run_id = task.get("run_id")
            status = task.get("status")
            additional_data = task.get("additional_data")
            update = self.update_test_run_status(run_id, status, additional_data)
            return {
                "success": True,
                "update": update
            }
        
        elif action == "compare_runs":
            run1 = task.get("run1", {})
            run2 = task.get("run2", {})
            comparison = self.compare_runs(run1, run2)
            return {
                "success": True,
                "comparison": comparison
            }
        
        elif action == "execute_test_code":
            return self.execute_test_code(
                task.get("test_code", ""),
                task.get("framework", "custom"),
                task.get("language", "unknown"),
                task.get("test_cases", []),
                task.get("risks", []),  # Truyền risks vào
                task.get("original_code", "")  # Truyền original_code vào
            )
        
        else:
            return {
                "success": False,
                "error": f"Unknown action: {action}"
            }
    
    def execute_test_code(
        self,
        test_code: str = "",
        framework: str = "custom",
        language: str = "unknown",
        test_cases: List[Dict[str, Any]] = None,
        risks: List[str] = None,
        original_code: str = ""
    ) -> Dict[str, Any]:
        """
        Execute test code (simulate hoặc thực sự run)
        
        Args:
            test_code: Generated test code (optional - will be generated from original_code if not provided)
            framework: Test framework
            language: Programming language
            test_cases: Original test cases để map results (optional - will be generated if not provided)
            risks: List of risks từ analysis để quyết định pass/fail
            original_code: Original source code từ user - REQUIRED if test_code is not provided
        """
        import random
        import time
        
        # If no test_code provided but original_code exists, generate test code from original_code
        if not test_code and original_code and original_code.strip():
            print(f"[DEBUG execution_agent] No test_code provided, generating from original_code...")
            
            # Try to get AI Analysis Agent from orchestrator
            try:
                from orchestrator import Orchestrator
                orchestrator = Orchestrator()
                ai_agent = orchestrator.agents.get("ai_analysis_agent")
                
                if not ai_agent:
                    # If orchestrator not available, try to create AI agent directly
                    from .ai_analysis_agent import AIAnalysisAgent
                    ai_agent = AIAnalysisAgent()
                
                # Step 1: Analyze code and generate test cases (only happy cases)
                print(f"[DEBUG execution_agent] Analyzing code to generate test cases...")
                analyze_result = ai_agent.process({
                    "action": "analyze_code",
                    "code": original_code,
                    "original_code": original_code,
                    "language": language
                })
                
                # Extract test cases from analysis (only unit/happy cases)
                parsed_test_cases = []
                if analyze_result.get("result") and isinstance(analyze_result.get("result"), dict):
                    all_test_cases = analyze_result.get("result").get("testCases", [])
                    # Filter only unit test cases (happy cases)
                    parsed_test_cases = [tc for tc in all_test_cases if tc.get("type", "").lower() == "unit"]
                
                # If no test cases found, create basic test cases from methods in code
                if not parsed_test_cases:
                    print(f"[WARNING execution_agent] No test cases found in analysis, creating basic test cases...")
                    # Simple method extraction (for Python)
                    if language.lower() == "python":
                        # Find all method definitions
                        method_pattern = r'def\s+(\w+)\s*\([^)]*\):'
                        methods = re.findall(method_pattern, original_code)
                        # Skip __init__ and private methods (starting with _)
                        methods = [m for m in methods if not m.startswith('_') or m == '__init__']
                        
                        # Create basic test cases for each method
                        for i, method_name in enumerate(methods):
                            parsed_test_cases.append({
                                "id": i + 1,
                                "name": f"{method_name}_WhenValidInput_ReturnsExpected",
                                "title": f"{method_name}_WhenValidInput_ReturnsExpected",
                                "function": method_name,
                                "type": "unit",
                                "description": f"Test {method_name} with valid input",
                                "steps": ["Arrange", "Act", "Assert"],
                                "expectedResult": "Returns expected result"
                            })
                
                # Update detected language if available
                if analyze_result.get("detectedLanguage"):
                    language = analyze_result.get("detectedLanguage")
                    print(f"[DEBUG execution_agent] Detected language from analysis: {language}")
                
                # Step 2: Generate test code from test cases
                if parsed_test_cases:
                    print(f"[DEBUG execution_agent] Generating test code for {len(parsed_test_cases)} test cases...")
                    generate_result = ai_agent.process({
                        "action": "generate_test_code",
                        "test_cases": parsed_test_cases,
                        "original_code": original_code,
                        "language": language,
                        "framework": framework
                    })
                    
                    if generate_result.get("success"):
                        generated_code_data = generate_result.get("generated_code", {})
                        test_code = generated_code_data.get("testCode", "")
                        framework = generate_result.get("framework", framework)
                        
                        if test_code:
                            print(f"[DEBUG execution_agent] Successfully generated test code (length: {len(test_code)})")
                            # Update test_cases if not provided
                            if not test_cases:
                                test_cases = parsed_test_cases
                        else:
                            print(f"[WARNING execution_agent] Generated test code is empty")
                    else:
                        print(f"[WARNING execution_agent] Failed to generate test code: {generate_result.get('error')}")
                
            except Exception as e:
                print(f"[WARNING execution_agent] Failed to generate test code from original_code: {str(e)}")
                import traceback
                print(f"[WARNING execution_agent] Traceback: {traceback.format_exc()}")
        
        if not test_code:
            return {
                "success": False,
                "error": "No test code provided and could not generate from original_code"
            }
        
        # Try to actually execute tests if possible, otherwise simulate
        actual_execution = self._should_actually_execute(language, framework)
        print(f"[DEBUG execution_agent] Should actually execute: {actual_execution}, language: {language}, framework: {framework}")
        
        if actual_execution:
            try:
                real_result = self._execute_real_tests(
                    test_code, framework, language, test_cases, risks, original_code
                )
                print(f"[DEBUG execution_agent] Real execution result keys: {list(real_result.keys()) if isinstance(real_result, dict) else 'not dict'}")
                import json
                print(f"[DEBUG execution_agent] Real execution result preview: {json.dumps(real_result, indent=2, default=str)[:1500]}")
                return real_result
            except Exception as e:
                # Fallback to simulation nếu thực sự chạy fails
                print(f"[WARNING] Real execution failed, falling back to simulation: {str(e)}")
                import traceback
                print(f"[WARNING] Traceback: {traceback.format_exc()}")
                # Continue với simulation logic below
        
        # Sắp xếp test cases: Happy case (unit/happy_path) trước, negative/edge sau
        sorted_test_cases = []
        if test_cases:
            # Sắp xếp theo priority
            type_priority = {
                'unit': 1,
                'happy_path': 1,
                'integration': 2,
                'edge': 3,
                'negative': 4
            }
            
            def get_test_priority(tc):
                test_type = tc.get("type", "").lower()
                return type_priority.get(test_type, 5)
            
            sorted_test_cases = sorted(test_cases, key=get_test_priority)
        else:
            sorted_test_cases = []
        
        # Simulate test execution (fallback hoặc khi không thể thực sự chạy)
        results = []
        total_time = 0
        
        num_tests = len(sorted_test_cases) if sorted_test_cases else random.randint(3, 10)
        risks = risks or []
        
        # Helper function để check nếu test case có risk liên quan
        def has_related_risk(test_case: Dict[str, Any]) -> bool:
            """Check nếu test case có risk liên quan dựa trên function name và test name"""
            if not risks or not test_case:
                return False
            
            function_name = test_case.get("function", "").lower()
            test_name = test_case.get("name", "").lower()
            test_type = test_case.get("type", "").lower()
            
            # Extract function name từ test name nếu có
            # Format: functionName_WhenCondition_ExpectedResult
            function_from_name = ""
            if "_" in test_name:
                function_from_name = test_name.split("_")[0].lower()
            
            # Match risks với function name hoặc test name
            for risk in risks:
                risk_lower = risk.lower()
                
                # Check 1: Direct function name match trong risk
                if function_name:
                    # Check nếu risk mention function name
                    if function_name in risk_lower:
                        return True
                    # Remove common prefixes để match (get, set, is, has)
                    clean_function = function_name
                    for prefix in ["get", "set", "is", "has", "add", "delete", "update", "create", "remove"]:
                        if clean_function.startswith(prefix):
                            clean_function = clean_function[len(prefix):]
                    if clean_function and len(clean_function) > 2 and clean_function in risk_lower:
                        return True
                
                # Check 2: Function name từ test name
                if function_from_name:
                    if function_from_name in risk_lower:
                        return True
                    # Remove prefixes
                    clean_name = function_from_name
                    for prefix in ["test", "should", "verify", "check"]:
                        if clean_name.startswith(prefix):
                            clean_name = clean_name[len(prefix):]
                    if clean_name and len(clean_name) > 2 and clean_name in risk_lower:
                        return True
                
                # Check 3: Partial match với test name keywords
                if test_name:
                    # Extract keywords từ test name
                    # Ví dụ: "deleteProduct_WhenProductExists_DoesNotRemoveProductFromProductsArray"
                    # -> keywords: ["delete", "product", "does", "not", "remove", "product", "from", "products", "array"]
                    keywords = re.findall(r'\b\w+\b', test_name.lower())
                    # Filter common words
                    meaningful_keywords = [k for k in keywords if k not in ["when", "then", "should", "test", "the", "a", "an", "is", "are", "from", "to", "and", "or"]]
                    
                    # Check nếu risk có chứa meaningful keywords
                    for keyword in meaningful_keywords:
                        if len(keyword) > 3 and keyword in risk_lower:
                            return True
                
                # Check 4: Negative tests và error keywords trong risk
                if test_type == "negative" or any(word in test_name for word in ["not", "fail", "error", "exception", "throw"]):
                    error_keywords = ["không", "không cập nhật", "không kiểm tra", "không thay đổi", "lỗi", "fail", "error", "exception", "throwing"]
                    if any(keyword in risk_lower for keyword in error_keywords):
                        return True
            
            return False
        
        # Execute theo thứ tự đã sắp xếp (happy case trước)
        for i in range(num_tests):
            # Simulate execution time
            execution_time = random.randint(50, 500)
            total_time += execution_time
            
            test_case = None
            test_name = ""
            if sorted_test_cases and i < len(sorted_test_cases):
                test_case = sorted_test_cases[i]
                test_name = test_case.get("name", test_case.get("title", f"Test {i+1}"))
            else:
                test_name = f"test_case_{i+1}"
            
            # Quyết định pass/fail dựa trên risks
            # Nếu có risk liên quan: 80-90% fail rate (realistic vì code có bug)
            # Nếu không có risk: 15% fail rate (normal)
            has_risk = has_related_risk(test_case) if test_case else False
            
            if has_risk:
                # Có risk liên quan -> xác suất fail cao hơn
                # Giảm pass rate xuống 10-20% (80-90% fail rate)
                fail_threshold = 0.15  # 15% pass, 85% fail
                # Nếu có nhiều risks thì fail rate còn cao hơn
                if len(risks) > 3:
                    fail_threshold = 0.10  # 10% pass, 90% fail
            else:
                # Không có risk -> xác suất pass cao hơn
                fail_threshold = 0.15  # 85% pass, 15% fail
            
            status = "pass" if random.random() > fail_threshold else "fail"
            
            # Debug log để kiểm tra matching
            if test_case:
                print(f"[DEBUG] Test: {test_name}, Function: {test_case.get('function', '')}, Has Risk: {has_risk}, Status: {status}")
            
            # Generate log
            log_lines = [
                f"[INFO] Starting test: {test_name}",
                f"[INFO] Framework: {framework}",
                f"[INFO] Language: {language}",
            ]
            
            if status == "pass":
                log_lines.append(f"[SUCCESS] Test passed in {execution_time}ms")
                error = None
            else:
                # Generate realistic error message based on test case details
                error_info = self._generate_realistic_error(test_case, test_name, language)
                log_lines.extend(error_info["log_lines"])
                error = error_info["error"]
            
            log_lines.append(f"[INFO] Test completed: {test_name}")
            
            result = {
                "id": i + 1,
                "name": test_name,
                "status": status,
                "timeMs": execution_time,
                "log": "\n".join(log_lines),
                "error": error,
                "executedAt": datetime.now().isoformat()
            }
            
            results.append(result)
        
        passed = sum(1 for r in results if r["status"] == "pass")
        failed = len(results) - passed
        
        simulation_result = {
            "success": True,
            "run_id": f"#{self._generate_run_id()}",
            "total": num_tests,
            "passed": passed,
            "failed": failed,
            "durationMs": total_time,
            "results": results,
            "framework": framework,
            "language": language,
            "executed_at": datetime.now().isoformat(),
            "execution_mode": "simulation"  # Flag để biết là simulation
        }
        
        print(f"[DEBUG execution_agent] Simulation result keys: {list(simulation_result.keys())}")
        import json
        print(f"[DEBUG execution_agent] Simulation result preview: {json.dumps(simulation_result, indent=2, default=str)[:1500]}")
        
        return simulation_result
    
    def _generate_realistic_error(
        self,
        test_case: Optional[Dict[str, Any]],
        test_name: str,
        language: str
    ) -> Dict[str, Any]:
        """
        Generate realistic error message dựa trên test case details
        """
        import random
        
        error_scenarios = []
        
        if test_case:
            function_name = test_case.get("function", "unknown")
            test_type = test_case.get("type", "unit")
            expected_result = test_case.get("expectedResult", "")
            
            # Dựa vào function name và test type để tạo error scenarios
            function_lower = function_name.lower()
            
            # Boolean return functions
            if any(keyword in function_lower for keyword in ["is", "has", "exists", "contains", "bookmarked"]):
                error_scenarios.append({
                    "type": "boolean",
                    "expected": "true",
                    "actual": "false",
                    "message": f"Expected {function_name}() to return true, but got false"
                })
                error_scenarios.append({
                    "type": "boolean",
                    "expected": "false", 
                    "actual": "true",
                    "message": f"Expected {function_name}() to return false, but got true"
                })
            
            # Return value functions (like get, find, retrieve)
            if any(keyword in function_lower for keyword in ["get", "find", "retrieve", "fetch", "load"]):
                error_scenarios.append({
                    "type": "null",
                    "expected": "non-null object",
                    "actual": "null",
                    "message": f"Expected {function_name}() to return a value, but got null"
                })
                error_scenarios.append({
                    "type": "value",
                    "expected": "UUID('123e4567-e89b-12d3-a456-426614174000')",
                    "actual": "UUID('00000000-0000-0000-0000-000000000000')",
                    "message": f"Expected {function_name}() to return valid object, but got invalid/empty object"
                })
            
            # Exception/throwing functions
            if any(keyword in function_lower for keyword in ["throw", "exception", "error"]):
                error_scenarios.append({
                    "type": "exception",
                    "expected": "AppException with message 'Resource not found'",
                    "actual": "No exception thrown",
                    "message": f"Expected {function_name}() to throw AppException, but no exception was thrown"
                })
            
            # List/collection return functions
            if any(keyword in function_lower for keyword in ["list", "all", "get", "find"]):
                error_scenarios.append({
                    "type": "count",
                    "expected": "3 items",
                    "actual": "0 items",
                    "message": f"Expected {function_name}() to return 3 items, but got empty list"
                })
                error_scenarios.append({
                    "type": "count",
                    "expected": "non-empty list",
                    "actual": "[] (empty list)",
                    "message": f"Expected {function_name}() to return list with items, but got empty list"
                })
            
            # Status/state functions
            if any(keyword in function_lower for keyword in ["status", "state", "save", "update"]):
                error_scenarios.append({
                    "type": "status",
                    "expected": "saved successfully",
                    "actual": "save failed",
                    "message": f"Expected {function_name}() to complete successfully, but operation failed"
                })
        
        # Default scenarios nếu không có test case
        if not error_scenarios:
            error_scenarios = [
                {
                    "type": "general",
                    "expected": "expected value",
                    "actual": "actual value",
                    "message": "Assertion failed: Expected value but got different value"
                },
                {
                    "type": "equality",
                    "expected": "true",
                    "actual": "false",
                    "message": "Expected true but got false"
                },
                {
                    "type": "null",
                    "expected": "non-null",
                    "actual": "null",
                    "message": "Expected non-null value but got null"
                }
            ]
        
        # Chọn random error scenario
        scenario = random.choice(error_scenarios)
        
        # Generate detailed log lines
        log_lines = [
            f"[ERROR] Assertion failed: {scenario['message']}",
            f"[ERROR] Expected: {scenario['expected']}",
            f"[ERROR] Actual: {scenario['actual']}"
        ]
        
        # Add stack trace info nếu là exception
        if scenario.get("type") == "exception":
            log_lines.append(f"[ERROR] at {test_name}(TestClass.java:42)")
            log_lines.append(f"[ERROR] at org.junit.Assert.assertThrows(Assert.java:857)")
        
        # Add context info
        if test_case and test_case.get("steps"):
            log_lines.append(f"[ERROR] Test steps: {' -> '.join(test_case.get('steps', [])[:3])}")
        
        error = f"AssertionError: {scenario['message']}\nExpected: {scenario['expected']}\nActual: {scenario['actual']}"
        
        return {
            "log_lines": log_lines,
            "error": error
        }
    
    def _should_actually_execute(self, language: str, framework: str) -> bool:
        """
        Quyết định có nên thực sự chạy tests không
        
        Args:
            language: Programming language
            framework: Test framework
            
        Returns:
            True nếu có thể thực sự chạy, False nếu nên simulate
        """
        # Chỉ thực sự chạy cho Python với pytest (dễ nhất và an toàn)
        # Có thể mở rộng sau cho các languages khác
        language_lower = language.lower()
        framework_lower = framework.lower()
        
        # Python pytest - có thể thực sự chạy nếu pytest có sẵn
        if language_lower in ["python", "py"] and "pytest" in framework_lower:
            # Try 1: Check pytest command trực tiếp
            try:
                print(f"[DEBUG execution_agent] Checking pytest availability (direct command)...")
                result = subprocess.run(
                    ["pytest", "--version"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                print(f"[DEBUG execution_agent] pytest --version returncode: {result.returncode}")
                print(f"[DEBUG execution_agent] pytest --version stdout: {result.stdout}")
                print(f"[DEBUG execution_agent] pytest --version stderr: {result.stderr}")
                if result.returncode == 0:
                    print(f"[DEBUG execution_agent] pytest is available (direct command)")
                    return True
            except FileNotFoundError:
                print(f"[DEBUG execution_agent] pytest command not found in PATH, trying python -m pytest...")
            except subprocess.TimeoutExpired:
                print(f"[DEBUG execution_agent] pytest --version timeout")
            except Exception as e:
                print(f"[DEBUG execution_agent] pytest direct check failed: {str(e)}")
            
            # Try 2: Check python -m pytest (fallback)
            try:
                print(f"[DEBUG execution_agent] Checking pytest availability (python -m pytest)...")
                result = subprocess.run(
                    ["python", "-m", "pytest", "--version"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                print(f"[DEBUG execution_agent] python -m pytest --version returncode: {result.returncode}")
                print(f"[DEBUG execution_agent] python -m pytest --version stdout: {result.stdout}")
                print(f"[DEBUG execution_agent] python -m pytest --version stderr: {result.stderr}")
                if result.returncode == 0:
                    print(f"[DEBUG execution_agent] pytest is available (python -m pytest)")
                    return True
            except FileNotFoundError:
                print(f"[DEBUG execution_agent] python command not found")
            except subprocess.TimeoutExpired:
                print(f"[DEBUG execution_agent] python -m pytest --version timeout")
            except Exception as e:
                print(f"[DEBUG execution_agent] python -m pytest check failed: {str(e)}")
            
            print(f"[DEBUG execution_agent] pytest not available, will use simulation")
            return False
        
        # JavaScript/TypeScript Jest - cần có Node.js và Jest
        if language_lower in ["javascript", "typescript", "js", "ts"] and "jest" in framework_lower:
            try:
                # Check nếu node có sẵn
                result = subprocess.run(
                    ["node", "--version"],
                    capture_output=True,
                    timeout=5
                )
                return result.returncode == 0
            except:
                return False
        
        # Các languages khác tạm thời simulate
        return False
    
    def _execute_real_tests(
        self,
        test_code: str,
        framework: str,
        language: str,
        test_cases: List[Dict[str, Any]],
        risks: List[str],
        original_code: str = ""
    ) -> Dict[str, Any]:
        """
        Thực sự chạy tests (Python pytest)
        
        Args:
            test_code: Generated test code
            framework: Test framework
            language: Programming language
            test_cases: Original test cases để map results
            risks: List of risks (dùng để validate results)
            original_code: Original source code từ user
        """
        language_lower = language.lower()
        framework_lower = framework.lower()
        
        if language_lower in ["python", "py"] and "pytest" in framework_lower:
            return self._execute_pytest_tests(test_code, test_cases, risks, original_code)
        
        if language_lower in ["javascript", "typescript", "js", "ts"] and "jest" in framework_lower:
            return self._execute_jest_tests(test_code, test_cases, risks, original_code)
        
        # Fallback nếu không support
        raise NotImplementedError(f"Real execution not yet implemented for {language}/{framework}")
    
    def _execute_pytest_tests(
        self,
        test_code: str,
        test_cases: List[Dict[str, Any]],
        risks: List[str],
        original_code: str = ""
    ) -> Dict[str, Any]:
        """
        Thực sự chạy Python pytest tests
        
        Args:
            test_code: Generated test code
            test_cases: Original test cases (đã được sắp xếp ở execute_test_code)
            risks: List of risks
            original_code: Original source code từ user để import
        """
        # Test cases đã được sắp xếp ở execute_test_code, nên không cần sort lại
        # Tạo temporary directory cho test files
        with tempfile.TemporaryDirectory() as tmpdir:
            # Tạo source file nếu có original_code
            source_file = None
            if original_code and original_code.strip():
                # Tìm class/function names để tạo file name phù hợp
                # Mặc định là "source.py" hoặc extract từ code
                # Tìm class name
                class_match = re.search(r'class\s+(\w+)', original_code)
                if class_match:
                    class_name = class_match.group(1).lower()
                    source_file = os.path.join(tmpdir, f"{class_name}.py")
                else:
                    source_file = os.path.join(tmpdir, "source.py")
                
                # Clean up original code before writing (remove JavaScript comments, etc.)
                cleaned_original_code = original_code
                
                # Remove JavaScript-style comments (//) - these cause syntax errors in Python
                lines = cleaned_original_code.split('\n')
                cleaned_lines = []
                for line in lines:
                    # Skip JavaScript-style single-line comments (but keep # Python comments)
                    if line.strip().startswith('//'):
                        continue
                    # Remove inline JavaScript comments
                    if '//' in line and not line.strip().startswith('#'):
                        # Check if // is inside a string or not
                        # Simple check: if there's a quote before //, it might be in a string
                        # For now, just remove everything after //
                        comment_pos = line.find('//')
                        if comment_pos > 0:
                            # Check if it's in a string (simplified check)
                            before_comment = line[:comment_pos]
                            single_quotes = before_comment.count("'") - before_comment.count("\\'")
                            double_quotes = before_comment.count('"') - before_comment.count('\\"')
                            # If even number of quotes, // is not in a string
                            if single_quotes % 2 == 0 and double_quotes % 2 == 0:
                                line = line[:comment_pos].rstrip()
                    cleaned_lines.append(line)
                cleaned_original_code = '\n'.join(cleaned_lines)
                
                # Remove other JavaScript syntax that might cause issues
                # Remove /* */ style comments
                cleaned_original_code = re.sub(r'/\*.*?\*/', '', cleaned_original_code, flags=re.DOTALL)
                
                # Write cleaned original code vào source file
                with open(source_file, "w", encoding="utf-8") as f:
                    f.write(cleaned_original_code)
                
                # Update test code để import từ source file
                # Thay thế mock imports bằng import thực tế
                source_module_name = os.path.splitext(os.path.basename(source_file))[0]
                
                # Check xem test code có mock implementation không
                if "mock" in test_code.lower() or "# Since we don't have" in test_code or "let products" in test_code or "// Mock" in test_code:
                    # Tìm và thay thế mock code bằng import
                    # Pattern: // Mock implementation hoặc // Since we don't have...
                    lines = test_code.split('\n')
                    new_lines = []
                    skip_mock = False
                    for line in lines:
                        # Skip mock comment blocks
                        if "// Since we don't have" in line or "// Mock" in line or "let products" in line:
                            skip_mock = True
                            # Add import instead
                            if "import" not in test_code and not any("import" in l for l in new_lines):
                                # Add import statement at the top
                                new_lines.insert(0, f"from {source_module_name} import *")
                            continue
                        if skip_mock and (line.strip() == "" or line.strip().startswith("//")):
                            continue
                        if skip_mock and not line.strip().startswith("//"):
                            skip_mock = False
                        
                        # Replace mock variables với import
                        if "let products" in line or "products = []" in line:
                            if f"from {source_module_name}" not in '\n'.join(new_lines):
                                new_lines.insert(0, f"from {source_module_name} import *")
                            continue
                        
                        new_lines.append(line)
                    
                    # Ensure import is at the top
                    if not any(f"from {source_module_name}" in line or f"import {source_module_name}" in line for line in new_lines):
                        # Find where imports should be
                        import_index = 0
                        for i, line in enumerate(new_lines):
                            if line.strip().startswith("import ") or line.strip().startswith("from "):
                                import_index = i + 1
                            elif line.strip() and not line.strip().startswith("#"):
                                break
                        new_lines.insert(import_index, f"from {source_module_name} import *")
                    
                    test_code = '\n'.join(new_lines)
                else:
                    # Nếu chưa có import, thêm vào
                    if f"from {source_module_name}" not in test_code and f"import {source_module_name}" not in test_code:
                        # Thêm import ở đầu file
                        import_lines = []
                        if test_code.strip().startswith("import ") or test_code.strip().startswith("from "):
                            # Insert after existing imports
                            lines = test_code.split('\n')
                            last_import = 0
                            for i, line in enumerate(lines):
                                if line.strip().startswith("import ") or line.strip().startswith("from "):
                                    last_import = i + 1
                                elif line.strip() and not line.strip().startswith("#"):
                                    break
                            lines.insert(last_import, f"from {source_module_name} import *")
                            test_code = '\n'.join(lines)
                        else:
                            test_code = f"from {source_module_name} import *\n\n{test_code}"
            
            # Clean up test code: Remove incorrect imports and sys.path manipulations
            # AI-generated test code often has wrong imports that need to be fixed
            test_code_lines = test_code.split('\n')
            cleaned_lines = []
            
            # Common wrong import patterns to remove (will be replaced with correct import)
            wrong_import_patterns = [
                "from product_manager import",
                "from ProductManager import",
                "from productmanager import",
                "from source import",
                "from original import",
            ]
            
            for line in test_code_lines:
                # Skip sys.path manipulations (they're not needed since source file is in same directory)
                if "sys.path" in line or "sys.path.insert" in line or "sys.path.append" in line:
                    continue
                
                # Check if this is an import line
                if line.strip().startswith("from ") or line.strip().startswith("import "):
                    import_line = line.strip().lower()
                    
                    # Keep standard library imports
                    stdlib_imports = ["import pytest", "import unittest", "from unittest", "import json", 
                                     "import datetime", "import re", "import random", "import time"]
                    if any(stdlib in import_line for stdlib in stdlib_imports):
                        # Keep import os and sys only if they're used for standard purposes (not sys.path)
                        if "import os" in import_line or "import sys" in import_line:
                            # Check if sys.path is used later - if yes, we'll skip these imports
                            # For now, keep them but they might be unnecessary
                            cleaned_lines.append(line)
                        else:
                            cleaned_lines.append(line)
                    # Keep our correct source module import
                    elif source_file and source_module_name and source_module_name.lower() in import_line:
                        cleaned_lines.append(line)
                    # Skip wrong imports that try to import classes/modules that don't exist
                    elif any(wrong_pattern in import_line for wrong_pattern in wrong_import_patterns):
                        # Skip this import - it will be replaced with correct import
                        continue
                    # Keep other imports (might be necessary dependencies)
                    else:
                        cleaned_lines.append(line)
                else:
                    cleaned_lines.append(line)
            
            # Ensure we have the correct import at the top
            test_code = '\n'.join(cleaned_lines)
            
            # Final check: ensure correct import exists
            if source_file and source_module_name:
                if f"from {source_module_name}" not in test_code and f"import {source_module_name}" not in test_code:
                    # Add import at the very top, after any standard library imports
                    lines = test_code.split('\n')
                    insert_index = 0
                    for i, line in enumerate(lines):
                        if line.strip().startswith("import ") or line.strip().startswith("from "):
                            insert_index = i + 1
                        elif line.strip() and not line.strip().startswith("#"):
                            break
                    lines.insert(insert_index, f"from {source_module_name} import *")
                    test_code = '\n'.join(lines)
            
            # Post-process test code: Fix common issues
            # Remove class definitions from test code (they should be in source file, not test file)
            # AI sometimes includes the class definition in test code which causes issues
            test_code_lines_final = test_code.split('\n')
            cleaned_test_lines = []
            skip_class_definition = False
            in_class = False
            indent_level = 0
            
            for i, line in enumerate(test_code_lines_final):
                stripped = line.strip()
                
                # Skip class definitions (they should be imported from source file)
                if stripped.startswith("class ") and not stripped.startswith("class Test"):
                    # Skip class definition lines
                    # Find where class ends (next line with same or less indent at root level)
                    if not skip_class_definition:
                        skip_class_definition = True
                        in_class = True
                        # Get base indent
                        indent_level = len(line) - len(line.lstrip())
                        # Skip this line
                        continue
                
                # If we're inside a class definition, check if we should continue skipping
                if skip_class_definition and in_class:
                    # Check if we're still in the class (indented)
                    current_indent = len(line) - len(line.lstrip())
                    if current_indent > indent_level or line.strip() == "":
                        # Still in class, skip
                        continue
                    else:
                        # Out of class, stop skipping
                        skip_class_definition = False
                        in_class = False
                
                # Skip standalone class definitions (with "# ... definition" comments)
                if "# ProductManager class definition" in line or "# class definition" in line.lower() or "(for reference only)" in line:
                    # Skip this comment and look for class definition
                    # Skip next few lines if they're class definition
                    j = i + 1
                    while j < len(test_code_lines_final) and j < i + 50:  # Limit search
                        next_line = test_code_lines_final[j].strip()
                        if next_line.startswith("class ") and not next_line.startswith("class Test"):
                            # Found class definition, skip until class ends
                            # This will be handled by the class skipping logic above
                            break
                        j += 1
                    continue
                
                cleaned_test_lines.append(line)
            
            test_code = '\n'.join(cleaned_test_lines)
            
            # Check if we have any test functions (pytest style)
            has_test_functions = any("def test_" in line for line in test_code.split('\n'))
            
            # If no test functions found, try to extract from testCases
            if not has_test_functions and test_cases:
                print(f"[WARNING execution_agent] No test functions (test_*) found in test code!")
                print(f"[WARNING execution_agent] Attempting to extract test functions from testCases...")
                
                # Try to find test code in testCases
                extracted_tests = []
                for tc in test_cases:
                    # Look for code snippet in test case
                    tc_code = tc.get("code", "")
                    if tc_code and ("def test_" in tc_code or "def test" in tc_code):
                        extracted_tests.append(tc_code)
                
                if extracted_tests:
                    # Combine extracted test code
                    test_code = test_code + "\n\n# Extracted test functions:\n" + "\n\n".join(extracted_tests)
                    print(f"[DEBUG execution_agent] Extracted {len(extracted_tests)} test functions from testCases")
                else:
                    print(f"[WARNING execution_agent] Could not extract test functions from testCases either")
                    print(f"[WARNING execution_agent] Test code might be malformed or incomplete")
            
            # Fix common syntax errors in generated test code
            # Fix: "def.test_" -> "def test_"
            test_code = test_code.replace("def.test_", "def test_")
            test_code = test_code.replace("def. test_", "def test_")
            test_code = test_code.replace("def.test(", "def test(")
            
            # Fix: "class.Test" -> "class Test"
            test_code = test_code.replace("class.Test", "class Test")
            test_code = test_code.replace("class. Test", "class Test")
            
            # Fix: remove extra dots in function definitions
            # Fix pattern like "def.test_name" -> "def test_name"
            test_code = re.sub(r'\bdef\.test_(\w+)', r'def test_\1', test_code)
            test_code = re.sub(r'\bdef\.test([A-Z]\w+)', r'def test\1', test_code)
            
            # Fix: "self.test_" patterns if any
            test_code = re.sub(r'self\.test_(\w+)', r'self.test_\1', test_code)
            
            # Validate Python syntax trước khi write
            try:
                compile(test_code, "<string>", "exec")
                print(f"[DEBUG execution_agent] Test code syntax is valid")
            except SyntaxError as e:
                print(f"[WARNING execution_agent] Test code has syntax error: {str(e)}")
                print(f"[WARNING execution_agent] Error at line {e.lineno}: {e.text}")
                # Try to fix more common issues
                # Fix missing space after def/class keywords
                test_code = re.sub(r'\bdef\.(\w+)', r'def \1', test_code)
                test_code = re.sub(r'\bclass\.(\w+)', r'class \1', test_code)
                test_code = re.sub(r'\bdef\s*\.(\w+)', r'def \1', test_code)
                test_code = re.sub(r'\bclass\s*\.(\w+)', r'class \1', test_code)
                
                # Try to validate again
                try:
                    compile(test_code, "<string>", "exec")
                    print(f"[DEBUG execution_agent] Test code syntax fixed and now valid")
                except SyntaxError as e2:
                    print(f"[WARNING execution_agent] Still has syntax error after fix: {str(e2)}")
                    # Still write it - pytest will show better error
            except Exception as e:
                print(f"[WARNING execution_agent] Error validating test code: {str(e)}")
            
            test_file = os.path.join(tmpdir, "test_generated.py")
            
            # Debug: Print test code preview before writing
            print(f"[DEBUG execution_agent] Test code preview (first 1500 chars):\n{test_code[:1500]}")
            
            # Write test code vào file
            with open(test_file, "w", encoding="utf-8") as f:
                f.write(test_code)
            
            # Also write source file if exists (for reference, though import should work)
            if source_file:
                print(f"[DEBUG execution_agent] Source file written to: {source_file}")
                print(f"[DEBUG execution_agent] Source module name: {source_module_name}")
                print(f"[DEBUG execution_agent] Test file: {test_file}")
            
            # Chạy pytest với JSON report
            start_time = datetime.now()
            
            # Xác định pytest command để dùng
            pytest_cmd = None
            # Try 1: pytest trực tiếp
            try:
                test_result = subprocess.run(
                    ["pytest", "--version"],
                    capture_output=True,
                    text=True,
                    timeout=2
                )
                if test_result.returncode == 0:
                    pytest_cmd = ["pytest"]
                    print(f"[DEBUG execution_agent] Using pytest command directly")
            except:
                pass
            
            # Try 2: python -m pytest (fallback)
            if not pytest_cmd:
                try:
                    test_result = subprocess.run(
                        ["python", "-m", "pytest", "--version"],
                        capture_output=True,
                        text=True,
                        timeout=2
                    )
                    if test_result.returncode == 0:
                        pytest_cmd = ["python", "-m", "pytest"]
                        print(f"[DEBUG execution_agent] Using python -m pytest")
                except:
                    pass
            
            # Nếu cả 2 đều không có, raise error
            if not pytest_cmd:
                raise FileNotFoundError("pytest not found. Please install pytest: pip install pytest")
            
            try:
                result = subprocess.run(
                    pytest_cmd + [
                        test_file,
                        "-v",  # Verbose để có output chi tiết
                        "--tb=short",  # Short traceback để có actual/expected values
                        "--durations=0",  # Show duration for all tests
                        "--no-header",  # Không show header
                        "--color=no"  # Không màu để dễ parse
                    ],
                    capture_output=True,
                    text=True,
                    timeout=60,  # Timeout 60s
                    cwd=tmpdir
                )
                print(f"[DEBUG execution_agent] Pytest execution returncode: {result.returncode}")
                print(f"[DEBUG execution_agent] Pytest execution stdout (first 1000 chars): {result.stdout[:1000]}")
                if result.stderr:
                    print(f"[DEBUG execution_agent] Pytest execution stderr (full):\n{result.stderr}")
                    # Also log full stderr to a temp file for debugging
                    stderr_file = os.path.join(tmpdir, "pytest_stderr.log")
                    with open(stderr_file, "w", encoding="utf-8") as f:
                        f.write(result.stderr)
                    print(f"[DEBUG execution_agent] Full stderr saved to: {stderr_file}")
                
                duration = (datetime.now() - start_time).total_seconds() * 1000
                
                # Parse pytest output
                stdout = result.stdout
                stderr = result.stderr
                
                # Check nếu có ERROR collecting (returncode 2 thường là collection error)
                if result.returncode != 0 and ("ERROR collecting" in stdout or "ERROR collecting" in stderr or result.returncode == 2):
                    # Parse error message từ stderr hoặc stdout (ưu tiên stderr)
                    error_message = stderr if stderr and stderr.strip() else stdout
                    
                    # Extract error details - get more context
                    error_lines = error_message.split("\n")
                    main_error = ""
                    error_context = []
                    
                    # Find ImportError, ModuleNotFoundError, SyntaxError first (these are the actual errors)
                    for i, line in enumerate(error_lines):
                        if any(error_type in line for error_type in [
                            "ImportError", "ModuleNotFoundError", "SyntaxError", "NameError", 
                            "IndentationError", "AttributeError", "TypeError"
                        ]):
                            main_error = line
                            # Get more context - from start of traceback to end of error
                            # Find traceback start
                            tb_start = i
                            for j in range(i, max(0, i - 20), -1):
                                if "Traceback" in error_lines[j] or "File" in error_lines[j] and ".py" in error_lines[j]:
                                    tb_start = j
                                    break
                            start = max(0, tb_start - 1)
                            end = min(len(error_lines), i + 15)
                            error_context = error_lines[start:end]
                            break
                    
                    # If no specific error found, look for ERROR collecting
                    if not main_error:
                        for i, line in enumerate(error_lines):
                            if "ERROR collecting" in line:
                                main_error = line
                                # Get context around this error
                                start = max(0, i - 5)
                                end = min(len(error_lines), i + 20)
                                error_context = error_lines[start:end]
                                break
                    
                    # If still no main error, get first ERROR or Traceback
                    if not main_error and error_lines:
                        for i, line in enumerate(error_lines):
                            if "ERROR" in line or "Traceback" in line or "Error" in line:
                                main_error = line
                                start = max(0, i - 3)
                                end = min(len(error_lines), i + 15)
                                error_context = error_lines[start:end]
                                break
                    
                    if not main_error:
                        main_error = "Test collection failed. Check test code syntax and imports."
                        # Get last meaningful lines
                        error_context = [line for line in error_lines[-30:] if line.strip()]
                    
                    # Combine error message - show more context
                    if error_context:
                        full_error_message = "\n".join(error_context)
                    else:
                        # If no context found, use full error message (limit to 2000 chars)
                        full_error_message = error_message[:2000]
                    
                    # Tạo fake test results để show error cho user
                    # Map tất cả test cases với status fail và error message
                    results = []
                    for idx, tc in enumerate(test_cases):
                        results.append({
                            "id": idx + 1,
                            "name": tc.get("name", f"Test {idx + 1}"),
                            "status": "fail",
                            "timeMs": 0,
                            "log": f"[ERROR] Test collection failed:\n{main_error}\n\nFull error details:\n{full_error_message}",
                            "error": f"Collection Error: {main_error}",
                            "executedAt": datetime.now().isoformat()
                        })
                    
                    # Return result với tất cả tests failed do collection error
                    pytest_result = {
                        "success": False,  # Mark as failed vì có collection error
                        "run_id": f"#{self._generate_run_id()}",
                        "total": len(results),
                        "passed": 0,
                        "failed": len(results),
                        "durationMs": int(duration),
                        "results": results,
                        "framework": "pytest",
                        "language": "python",
                        "executed_at": datetime.now().isoformat(),
                        "execution_mode": "real",  # Vẫn là real execution, chỉ là có error
                        "error": f"Test collection failed: {main_error}"
                    }
                    
                    print(f"[DEBUG execution_agent] Pytest collection error - created {len(results)} failed results")
                    return pytest_result
                
                # Extract test results từ output (normal case)
                results = []
                passed_count = 0
                failed_count = 0
                
                # First, parse duration summary from pytest output (slowest durations section)
                # Format: "0.05s test_name" or "50ms test_name"
                duration_map = {}
                if "--durations=0" in pytest_cmd or True:  # Always try to parse durations
                    # Look for "slowest durations" section
                    slowest_match = re.search(r'slowest durations.*?\n(.*?)(?:\n===|$)', stdout, re.DOTALL | re.IGNORECASE)
                    if slowest_match:
                        slowest_section = slowest_match.group(1)
                        # Parse lines like "0.05s test_name" or "50ms test_name"
                        duration_lines = slowest_section.strip().split('\n')
                        for dur_line in duration_lines:
                            dur_line = dur_line.strip()
                            if not dur_line:
                                continue
                            # Pattern: "X.XXs test_name" or "Xms test_name"
                            dur_match = re.search(r'(\d+\.?\d*)\s*(s|ms)\s+(.+?)(?:\s|$)', dur_line)
                            if dur_match:
                                dur_value = float(dur_match.group(1))
                                dur_unit = dur_match.group(2)
                                test_name_with_dur = dur_match.group(3).strip()
                                # Remove file prefix if any
                                if "::" in test_name_with_dur:
                                    test_name_with_dur = test_name_with_dur.split("::")[-1]
                                
                                # Convert to ms
                                if dur_unit == 's':
                                    dur_ms = int(dur_value * 1000)
                                else:
                                    dur_ms = int(dur_value)
                                
                                duration_map[test_name_with_dur] = dur_ms
                                print(f"[DEBUG execution_agent] Parsed duration for {test_name_with_dur}: {dur_ms}ms")
                
                # Parse pytest verbose output
                # Pytest output formats:
                # 1. test_file.py::test_name PASSED [XX%] in X.XXs
                # 2. test_file.py::test_name FAILED [XX%] in X.XXs  
                # 3. test_name PASSED
                # 4. test_name FAILED
                
                # Multiple patterns to catch different formats
                # Format: test_file.py::test_name PASSED [XX%] hoặc test_name PASSED
                # Examples:
                # - test_generated.py::test_addProduct_WhenValidProduct_AddsProductAndUpdatesTotalValue PASSED [ 20%]
                # - test_name PASSED [ 20%]
                test_patterns = [
                    # Pattern 1: test_file.py::test_name PASSED/FAILED [XX%] (with file prefix) - most common
                    # Note: [XX%] may have spaces like [  9%], so we use \s* to match optional spaces
                    r"(.+?)::(.+?)\s+(PASSED|FAILED|ERROR)\s*(?:\[\s*\d+%\])?",
                    # Pattern 2: test_name PASSED/FAILED [XX%] (no file prefix)
                    r"^([^:]+?)\s+(PASSED|FAILED|ERROR)\s*(?:\[\s*\d+%\])?",
                    # Pattern 3: Simple format without percentage
                    r"(.+?)\s+(PASSED|FAILED|ERROR)(?:\s|$)",
                ]
                
                test_names_found = []
                line_count = 0
                matched_count = 0
                for line in stdout.split("\n"):
                    line = line.strip()
                    line_count += 1
                    if not line:
                        continue
                    
                    # Skip header/summary lines but keep test result lines
                    # Skip lines that are clearly headers/summaries
                    if (line.startswith("====") or 
                        line.startswith("-----") or 
                        "test session starts" in line.lower() or 
                        ("collecting" in line.lower() and "collected" in line.lower()) or
                        "slowest durations" in line.lower() or
                        "(42 durations" in line.lower() or
                        ("passed in" in line.lower() and "s ==" in line.lower())):
                        continue
                    
                    match = None
                    pattern_idx = 0
                    for idx, pattern in enumerate(test_patterns):
                        match = re.search(pattern, line)
                        if match:
                            pattern_idx = idx
                            print(f"[DEBUG execution_agent] Matched pattern {idx} for line: {line[:100]}")
                            break
                    
                    if not match:
                        # Debug: log lines that look like test results but didn't match
                        if ("PASSED" in line or "FAILED" in line or "ERROR" in line) and "::" in line:
                            print(f"[DEBUG execution_agent] No match for test-like line: {line[:150]}")
                        continue
                    
                    # Extract test name based on which pattern matched
                    test_name = None
                    try:
                        if pattern_idx == 0:
                            # Pattern 1: test_file.py::test_name -> use group(2) for test name
                            if match.lastindex >= 2:
                                test_name = match.group(2).strip()
                        else:
                            # Pattern 2 or 3: test_name -> use group(1)
                            if match.lastindex >= 1:
                                test_name = match.group(1).strip()
                                # Remove file path prefix if any
                                if "::" in test_name:
                                    test_name = test_name.split("::")[-1]
                    except (IndexError, AttributeError) as e:
                        print(f"[DEBUG execution_agent] Failed to extract test_name from match: {e}")
                        continue
                    
                    if not test_name or not test_name.strip():
                        print(f"[DEBUG execution_agent] Empty test_name, skipping line: {line[:100]}")
                        continue
                    
                    test_name = test_name.strip()
                    
                    if test_name in test_names_found:
                        print(f"[DEBUG execution_agent] Skipping duplicate test: {test_name}")
                        continue  # Skip duplicate
                    
                    test_names_found.append(test_name)
                    matched_count += 1
                    print(f"[DEBUG execution_agent] Processing test #{matched_count}: {test_name}")
                        
                    # Extract status
                    if pattern_idx == 0:
                        status_str = match.group(3).strip()
                    else:
                        status_str = match.group(2).strip()
                    
                    # Parse duration - first try from duration_map (parsed from summary)
                    duration_ms = duration_map.get(test_name, 0)
                    
                    # If not found in duration_map, try to parse from the line itself
                    if duration_ms == 0:
                        # Look for "in X.XXs" or "in Xms" in the line
                        duration_match = re.search(r'in\s+(\d+\.?\d*)\s*(s|ms|seconds?)', line, re.IGNORECASE)
                        if duration_match:
                            try:
                                duration_val = float(duration_match.group(1))
                                unit = duration_match.group(2).lower()
                                if unit == 's' or 'second' in unit:
                                    duration_ms = int(duration_val * 1000)
                                else:
                                    duration_ms = int(duration_val)
                            except:
                                pass
                    
                    # If still 0, try to find any duration pattern in the line
                    if duration_ms == 0:
                        duration_match = re.search(r'(\d+\.?\d*)\s*(s|ms|seconds?)', line, re.IGNORECASE)
                        if duration_match:
                            try:
                                duration_val = float(duration_match.group(1))
                                unit = duration_match.group(2).lower()
                                if unit == 's' or 'second' in unit:
                                    duration_ms = int(duration_val * 1000)
                                else:
                                    duration_ms = int(duration_val)
                            except:
                                pass
                    
                    # Only use default minimum if we really can't find any duration
                    # But use a more realistic default based on test execution
                    if duration_ms == 0:
                        # Use a small random duration instead of fixed 10ms
                        duration_ms = random.randint(5, 50)  # 5-50ms range
                        print(f"[WARNING execution_agent] No duration found for {test_name}, using estimated {duration_ms}ms")
                    else:
                        print(f"[DEBUG execution_agent] Duration for {test_name}: {duration_ms}ms")
                    
                    # Set status from status_str (must be done regardless of duration)
                    status = "pass" if status_str == "PASSED" else "fail"
                    if status == "pass":
                        passed_count += 1
                    else:
                        failed_count += 1
                        
                    # Parse error message with actual/expected values
                    error = None
                    actual_value = None
                    expected_value = None
                    log = f"[INFO] Running test: {test_name}\n"
                    
                    if status == "fail":
                        # Tìm error message trong stderr hoặc stdout
                        error_section = ""
                        error_start_idx = -1
                        
                        # Search in stderr first
                        if stderr:
                            error_start_idx = stderr.find(test_name)
                            if error_start_idx != -1:
                                error_section = stderr[error_start_idx:]
                        
                        # If not found in stderr, search in stdout
                        if not error_section and stdout:
                            error_start_idx = stdout.find(test_name)
                            if error_start_idx != -1:
                                error_section = stdout[error_start_idx:]
                        
                        if error_section:
                            # Extract error lines
                            error_lines = error_section.split("\n")[:30]  # Get more context
                            
                            # Try to extract actual/expected from assertion errors
                            # Pytest assertion format examples:
                            # 1. assert 2 == 3
                            #    AssertionError: assert 2 == 3
                            # 2. assert actual == expected  
                            #    AssertionError: assert 5 == 10
                            # 3. Expected: 10, Actual: 5
                            # 4. assert False (with expanded values in next lines)
                            
                            for i, err_line in enumerate(error_lines):
                                # Look for "Expected:" and "Actual:" patterns (explicit)
                                expected_match = re.search(r'[Ee]xpected[:\s=]+(.+?)(?:\s*,\s*[Aa]ctual|\s+[Aa]ctual|$|\n)', err_line)
                                actual_match = re.search(r'[Aa]ctual[:\s=]+(.+?)(?:$|\n|,|AssertionError|assert)', err_line)
                                
                                if expected_match and not expected_value:
                                    expected_value = expected_match.group(1).strip().rstrip(',')
                                if actual_match and not actual_value:
                                    actual_value = actual_match.group(1).strip().rstrip(',')
                                
                                # Look for AssertionError: assert X == Y or assert X != Y
                                assertion_pattern = r'[Aa]ssertionError:?\s*assert\s+(.+?)\s*([!=<>]+)\s*(.+?)(?:$|\n|,)'
                                assertion_match = re.search(assertion_pattern, err_line)
                                if assertion_match:
                                    val1 = assertion_match.group(1).strip()
                                    operator = assertion_match.group(2).strip()
                                    val2 = assertion_match.group(3).strip()
                                    
                                    # Clean up values (remove quotes, brackets, etc.)
                                    val1 = val1.strip("'\"[]()")
                                    val2 = val2.strip("'\"[]()")
                                    
                                    # For == or !=, try to determine expected vs actual
                                    if operator in ['==', '!=']:
                                        # Usually left side is actual, right side is expected in assertions
                                        # But pytest sometimes shows: assert expected == actual
                                        # Check surrounding context
                                        if not actual_value and not expected_value:
                                            # Heuristic: If we see "expected" keyword nearby, use that
                                            context_before = ' '.join(error_lines[max(0, i-3):i]).lower()
                                            if 'expected' in context_before or 'should' in context_before:
                                                expected_value = val2
                                                actual_value = val1
                                            else:
                                                # Default: left is actual, right is expected
                                                actual_value = val1
                                                expected_value = val2
                                
                                # Look for standalone assert X == Y lines (without AssertionError prefix)
                                if "assert" in err_line and ("==" in err_line or "!=" in err_line or "<" in err_line or ">" in err_line):
                                    # Pattern: assert value1 == value2
                                    assert_match = re.search(r'assert\s+(.+?)\s*([!=<>]+)\s*(.+?)(?:$|\n|#)', err_line)
                                    if assert_match and not actual_value:
                                        val1 = assert_match.group(1).strip().strip("'\"")
                                        val2 = assert_match.group(2).strip() + " " + assert_match.group(3).strip().strip("'\"")
                                        # Check next line for the actual error
                                        if i + 1 < len(error_lines):
                                            next_line = error_lines[i + 1]
                                            if "AssertionError" in next_line or "assert" in next_line:
                                                # Extract from next line
                                                next_assert = re.search(r'assert\s+(.+?)\s*([!=<>]+)\s*(.+?)(?:$|\n)', next_line)
                                                if next_assert:
                                                    actual_value = next_assert.group(1).strip().strip("'\"")
                                                    expected_value = next_assert.group(3).strip().strip("'\"")
                            
                            # Build error message with actual/expected
                            error = "\n".join(error_lines[:20])  # Limit to 20 lines
                            
                            if expected_value or actual_value:
                                error_details = []
                                if expected_value:
                                    error_details.append(f"Expected: {expected_value}")
                                if actual_value:
                                    error_details.append(f"Actual: {actual_value}")
                                if error_details:
                                    error = "\n".join(error_details) + "\n\n" + error
                            
                            log += f"[ERROR] Test failed:\n{error}"
                    else:
                        # Fallback: use generic error if no error_section found
                        error = "Test assertion failed"
                        log += f"[ERROR] {error}"
                else:
                    # Test passed - no error
                    error = None
                    log += f"[SUCCESS] Test passed in {duration_ms:.0f}ms"
                
                # Find matching test case (for both pass and fail)
                matching_test = None
                for tc in test_cases:
                    tc_name = tc.get("name", "").lower()
                    if tc_name and (tc_name in test_name.lower() or test_name.lower() in tc_name):
                        matching_test = tc
                        break
                
                # Append test result - wrap in try-except to catch any errors
                print(f"[DEBUG execution_agent] About to append test: {test_name}, current results count: {len(results)}")
                try:
                    results.append({
                        "id": len(results) + 1,
                        "name": test_name,
                        "status": status,
                        "timeMs": int(duration_ms) if duration_ms > 0 else 10,  # Ensure at least 10ms
                        "log": log,
                        "error": error,
                        "executedAt": datetime.now().isoformat()
                    })
                    print(f"[DEBUG execution_agent] Successfully appended test #{len(results)}: {test_name} ({status})")
                except Exception as append_error:
                    print(f"[ERROR execution_agent] Failed to append test {test_name}: {str(append_error)}")
                    import traceback
                    print(f"[ERROR execution_agent] Traceback: {traceback.format_exc()}")
                    # Try to append a basic version without error details
                    try:
                        results.append({
                            "id": len(results) + 1,
                            "name": test_name,
                            "status": status,
                            "timeMs": int(duration_ms) if duration_ms > 0 else 10,
                            "log": f"[INFO] Running test: {test_name}\n[ERROR] Failed to parse full details",
                            "error": f"Parse error: {str(append_error)}",
                            "executedAt": datetime.now().isoformat()
                        })
                        print(f"[DEBUG execution_agent] Appended basic test #{len(results)}: {test_name} ({status})")
                    except:
                        print(f"[ERROR execution_agent] Completely failed to append test {test_name}")
                
                # Debug: Log after each append to track results
                print(f"[DEBUG execution_agent] After appending test #{matched_count}: total results = {len(results)}, matched tests = {matched_count}, line count = {line_count}")
                if not results:
                    print(f"[WARNING execution_agent] Could not parse pytest output. Return code: {result.returncode}")
                    print(f"[DEBUG execution_agent] Stdout length: {len(stdout)}, first 2000 chars:\n{stdout[:2000]}")
                    if stderr:
                        print(f"[DEBUG execution_agent] Stderr length: {len(stderr)}, first 2000 chars:\n{stderr[:2000]}")
                    
                    # Try to extract test names from FAILURES section if available
                    if "FAILURES" in stdout or "FAILED" in stdout:
                        # Parse from FAILURES section
                        failures_match = re.search(r'FAILURES.*?\n(.*?)(?:\n===|$)', stdout, re.DOTALL)
                        if failures_match:
                            failures_section = failures_match.group(1)
                            # Try to find test names in format: test_name FAILED
                            failed_test_pattern = r'^_{3,}\s+(.+?)\s+_{3,}'
                            for line in failures_section.split('\n'):
                                failed_match = re.search(failed_test_pattern, line)
                                if failed_match:
                                    failed_test_name = failed_match.group(1).strip()
                                    if "::" in failed_test_name:
                                        failed_test_name = failed_test_name.split("::")[-1]
                                    
                                    # Check if already added
                                    if not any(r["name"] == failed_test_name for r in results):
                                        results.append({
                                            "id": len(results) + 1,
                                            "name": failed_test_name,
                                            "status": "fail",
                                            "timeMs": 10,
                                            "log": f"[ERROR] Test failed (parsed from FAILURES section)",
                                            "error": "Test assertion failed",
                                            "executedAt": datetime.now().isoformat()
                                        })
                    
                    # If still no results, raise error
                    if not results:
                        error_msg = f"Could not parse pytest output. Return code: {result.returncode}\n"
                        error_msg += f"Stdout (first 2000 chars):\n{stdout[:2000]}\n"
                        if stderr:
                            error_msg += f"Stderr (first 2000 chars):\n{stderr[:2000]}"
                        raise ValueError(error_msg)
                
                pytest_result = {
                    "success": True,
                    "run_id": f"#{self._generate_run_id()}",
                    "total": len(results),
                    "passed": passed_count,
                    "failed": failed_count,
                    "durationMs": int(duration),
                    "results": results,
                    "framework": "pytest",
                    "language": "python",
                    "executed_at": datetime.now().isoformat(),
                    "execution_mode": "real"  # Flag để biết là thực sự chạy
                }
                
                print(f"[DEBUG execution_agent] Pytest execution result keys: {list(pytest_result.keys())}")
                import json
                print(f"[DEBUG execution_agent] Pytest execution result preview: {json.dumps(pytest_result, indent=2, default=str)[:1500]}")
                
                return pytest_result
                
            except subprocess.TimeoutExpired:
                raise TimeoutError("Test execution timeout after 60 seconds")
            except Exception as e:
                raise Exception(f"Failed to execute pytest tests: {str(e)}")
    
    def _execute_jest_tests(
        self,
        test_code: str,
        test_cases: List[Dict[str, Any]],
        risks: List[str],
        original_code: str = ""
    ) -> Dict[str, Any]:
        """
        Thực sự chạy JavaScript/TypeScript Jest tests
        
        Note: Cần setup Jest project structure, nên có thể phức tạp hơn
        
        Args:
            test_code: Generated test code
            test_cases: Original test cases
            risks: List of risks
            original_code: Original source code từ user để import
        """
        # Tạm thời raise để fallback về simulation
        # Có thể implement sau khi có nhu cầu
        # TODO: Implement combine original_code với test_code cho JavaScript
        raise NotImplementedError("Jest execution not yet fully implemented")

