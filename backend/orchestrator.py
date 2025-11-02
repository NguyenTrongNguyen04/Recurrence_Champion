"""
Orchestrator - Điều phối workflow giữa các agents
"""
from typing import Dict, Any, List, Optional
import json
from agents import (
    LeaderAgent,
    TestingAgent,
    ExecutionAgent,
    ReportingAgent,
    AIAnalysisAgent
)


class Orchestrator:
    """Điều phối workflow giữa các agents"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        self.leader = LeaderAgent(api_key)
        self.agents = {
            "testing_agent": TestingAgent(api_key),
            "execution_agent": ExecutionAgent(api_key),
            "reporting_agent": ReportingAgent(api_key),
            "ai_analysis_agent": AIAnalysisAgent(api_key)
        }
    
    def process_request(
        self,
        user_request: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Xử lý request từ user - điều phối workflow
        
        Args:
            user_request: Yêu cầu từ user
            context: Context bổ sung
            
        Returns:
            Kết quả cuối cùng sau khi hoàn thành workflow
        """
        # Bước 1: Leader Agent phân tích và tạo plan
        leader_task = {
            "request": user_request,
            "context": context or {}
        }
        
        leader_result = self.leader.process(leader_task)
        
        if not leader_result.get("success"):
            return {
                "success": False,
                "error": "Leader agent failed to create plan",
                "details": leader_result
            }
        
        plan = leader_result.get("leader_plan", {})
        workflow = plan.get("workflow", [])
        
        # Bước 2: Thực thi workflow
        results = []
        previous_output = None
        ai_response_text = None  # Store AI response text
        
        for step in workflow:
            agent_name = step.get("agent")
            task = step.get("task", "")
            step_input = step.get("input", {})
            
            if agent_name not in self.agents:
                results.append({
                    "step": agent_name,
                    "success": False,
                    "error": f"Unknown agent: {agent_name}"
                })
                continue
            
            # Merge previous output vào input nếu cần
            if previous_output:
                step_input.update({"previous_output": previous_output})
            
            # Gọi agent
            agent = self.agents[agent_name]
            agent_task = {
                **step_input,
                "task_description": task
            }
            
            # Đặc biệt cho ai_analysis_agent: nếu là code analysis, đảm bảo action đúng
            if agent_name == "ai_analysis_agent" and context and context.get("source") in ["uploaded_files", "code_snippet", "github"]:
                # Extract code từ context trước (code thực sự), sau đó mới từ step_input hoặc user_request
                code = context.get("code") or step_input.get("code") or user_request
                if code and len(code) > 100:  # Nếu có code thực sự
                    language = context.get("detected_languages", ["unknown"])
                    if isinstance(language, list) and len(language) > 0:
                        language = language[0]
                    else:
                        language = "unknown"
                    
                    # Giới hạn code để tránh quá dài
                    code_to_use = code[:10000] if isinstance(code, str) else str(code)[:10000]
                    
                    agent_task = {
                        "action": "analyze_code",
                        "code": code_to_use,
                        "language": language,
                        "context": context
                    }
                    print(f"[DEBUG orchestrator] Override agent_task for ai_analysis_agent: action=analyze_code, language={language}, code_length={len(code_to_use)}")
            
            agent_result = agent.process(agent_task)
            results.append({
                "step": agent_name,
                "task": task,
                "result": agent_result
            })
            
            # Lưu output để dùng cho step tiếp theo
            if agent_result.get("success"):
                previous_output = agent_result
                
                # Extract AI response text nếu là ai_analysis_agent
                if agent_name == "ai_analysis_agent":
                    # Try to extract response text
                    if isinstance(agent_result, dict):
                        # Ưu tiên: result.testCases (từ analyze_code)
                        if "result" in agent_result and isinstance(agent_result.get("result"), dict):
                            result_data = agent_result.get("result")
                            # Nếu có testCases, dùng result_data
                            if "testCases" in result_data:
                                ai_response_text = json.dumps(result_data)
                                print(f"[DEBUG orchestrator] Extracted testCases from result: {len(result_data.get('testCases', []))}")
                            else:
                                # Nếu không có testCases, vẫn dùng result_data (có thể có summary)
                                ai_response_text = json.dumps(result_data)
                        # Fallback: testCases trực tiếp
                        elif "testCases" in agent_result:
                            ai_response_text = json.dumps(agent_result)
                        # Fallback: content (raw response)
                        elif "content" in agent_result:
                            ai_response_text = agent_result.get("content")
                        # Last resort: convert to JSON
                        else:
                            ai_response_text = json.dumps(agent_result)
                    else:
                        # Nếu không phải dict, convert to JSON string
                        ai_response_text = json.dumps(agent_result) if agent_result else ""
        
        # Nếu không có ai_analysis_agent trong workflow, thử gọi trực tiếp
        if not ai_response_text and "ai_analysis_agent" not in [step.get("agent") for step in workflow]:
            # Analyze code directly với ai_analysis_agent
            ai_agent = self.agents["ai_analysis_agent"]
            # Extract code từ context hoặc user_request
            if context and context.get("source") in ["uploaded_files", "code_snippet", "github"]:
                try:
                    # Extract code từ context trước (code thực sự), sau đó mới từ user_request
                    code_to_analyze = context.get("code") or user_request
                    language = context.get("detected_languages", ["unknown"])
                    if isinstance(language, list) and len(language) > 0:
                        language = language[0]
                    else:
                        language = "unknown"
                    
                    # Giới hạn code để tránh quá dài
                    if isinstance(code_to_analyze, str):
                        code_to_use = code_to_analyze[:10000]
                    else:
                        code_to_use = str(code_to_analyze)[:10000]
                    
                    ai_task = {
                        "action": "analyze_code",
                        "code": code_to_use,
                        "language": language,
                        "context": context
                    }
                    print(f"[DEBUG orchestrator] Direct call: code_length={len(code_to_use)}, language={language}")
                    ai_result = ai_agent.process(ai_task)
                    print(f"[DEBUG orchestrator] Direct AI call result keys: {ai_result.keys() if isinstance(ai_result, dict) else 'not dict'}")
                    if ai_result.get("success"):
                        previous_output = ai_result
                        # Extract parsed result
                        result_data = ai_result.get("result")
                        if result_data and isinstance(result_data, dict):
                            # Nếu có testCases trong result_data
                            if "testCases" in result_data:
                                ai_response_text = json.dumps(result_data)
                                print(f"[DEBUG orchestrator] Direct call found testCases: {len(result_data.get('testCases', []))}")
                            else:
                                ai_response_text = json.dumps(result_data)
                        elif ai_result.get("testCases"):
                            # Nếu testCases ở top level
                            ai_response_text = json.dumps(ai_result)
                        elif ai_result.get("content"):
                            ai_response_text = ai_result.get("content")
                        else:
                            ai_response_text = json.dumps(ai_result)
                except Exception as e:
                    print(f"Error calling ai_analysis_agent directly: {e}")
        
        return {
            "success": True,
            "original_request": user_request,
            "plan": plan,
            "workflow_results": results,
            "final_output": previous_output,
            "ai_response_text": ai_response_text  # Include AI response text
        }
    
    def process_test_results_upload(
        self,
        file_content: str,
        file_name: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Xử lý upload test results file - workflow tự động
        
        Args:
            file_content: Nội dung file test results
            file_name: Tên file
            metadata: Metadata (branch, commit, author, etc.)
        """
        results = []
        
        # Bước 1: Testing Agent - Parse file
        testing_agent = self.agents["testing_agent"]
        parse_result = testing_agent.process({
            "file_content": file_content,
            "file_name": file_name
        })
        results.append({"step": "parse", "result": parse_result})
        
        if not parse_result.get("success"):
            return {
                "success": False,
                "error": "Failed to parse test results",
                "results": results
            }
        
        parsed_data = parse_result.get("parsed_data", {})
        
        # Bước 2: Execution Agent - Tạo test run
        execution_agent = self.agents["execution_agent"]
        test_run_result = execution_agent.process({
            "action": "create_run",
            "test_results": parsed_data,
            "metadata": metadata
        })
        results.append({"step": "create_run", "result": test_run_result})
        
        if not test_run_result.get("success"):
            return {
                "success": False,
                "error": "Failed to create test run",
                "results": results
            }
        
        test_run = test_run_result.get("test_run", {})
        
        # Bước 3: Nếu có lỗi, gọi AI Analysis Agent
        if parsed_data.get("failed", 0) > 0:
            failed_tests = [
                t for t in parsed_data.get("tests", [])
                if t.get("status") == "fail"
            ]
            
            ai_agent = self.agents["ai_analysis_agent"]
            ai_result = ai_agent.process({
                "action": "analyze_multiple",
                "failed_tests": failed_tests
            })
            results.append({"step": "ai_analysis", "result": ai_result})
            
            # Generate summary
            if ai_result.get("success"):
                analyses = ai_result.get("analyses", [])
                summary_result = ai_agent.process({
                    "action": "generate_summary",
                    "error_analyses": analyses,
                    "test_run": test_run
                })
                results.append({"step": "ai_summary", "result": summary_result})
                
                # Thêm AI insights vào test run
                if summary_result.get("success"):
                    test_run["ai_analysis"] = summary_result.get("summary", {})
        
        # Bước 4: Reporting Agent - Tạo dashboard data
        reporting_agent = self.agents["reporting_agent"]
        # Note: Trong production, sẽ lấy từ database
        dashboard_result = reporting_agent.process({
            "report_type": "dashboard",
            "test_runs": [test_run]  # Chỉ có 1 run mới
        })
        results.append({"step": "dashboard", "result": dashboard_result})
        
        return {
            "success": True,
            "test_run": test_run,
            "parsed_data": parsed_data,
            "results": results
        }
    
    def get_dashboard_data(
        self,
        test_runs: List[Dict[str, Any]],
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Lấy dashboard data từ danh sách test runs
        """
        reporting_agent = self.agents["reporting_agent"]
        
        # Apply filters nếu có
        filtered_runs = test_runs
        if filters:
            reporting_result = reporting_agent.process({
                "report_type": "history",
                "test_runs": test_runs,
                "filters": filters
            })
            if reporting_result.get("success"):
                filtered_run_ids = {
                    item["run_id"] for item in 
                    reporting_result.get("data", {}).get("history", [])
                }
                filtered_runs = [
                    run for run in test_runs
                    if run.get("run_id") in filtered_run_ids
                ]
        
        # Generate dashboard
        dashboard_result = reporting_agent.process({
            "report_type": "dashboard",
            "test_runs": filtered_runs
        })
        
        return dashboard_result
    
    def analyze_test_errors(
        self,
        test_run: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Phân tích lỗi của một test run
        """
        failed_tests = [
            t for t in test_run.get("test_results", [])
            if t.get("status") == "fail"
        ]
        
        if not failed_tests:
            return {
                "success": True,
                "message": "Không có lỗi để phân tích",
                "analyses": []
            }
        
        ai_agent = self.agents["ai_analysis_agent"]
        
        # Analyze errors
        analyze_result = ai_agent.process({
            "action": "analyze_multiple",
            "failed_tests": failed_tests
        })
        
        if not analyze_result.get("success"):
            return analyze_result
        
        analyses = analyze_result.get("analyses", [])
        
        # Group errors
        group_result = ai_agent.process({
            "action": "group_errors",
            "error_analyses": analyses
        })
        
        # Generate summary
        summary_result = ai_agent.process({
            "action": "generate_summary",
            "error_analyses": analyses,
            "test_run": test_run
        })
        
        return {
            "success": True,
            "analyses": analyses,
            "groups": group_result.get("groups", {}) if group_result.get("success") else {},
            "summary": summary_result.get("summary", {}) if summary_result.get("success") else {}
        }

