"""
Leader Agent (Orchestrator) - Điều phối và phân công công việc cho các specialist agents
"""
from typing import Dict, Any, List
from .base_agent import BaseAgent


class LeaderAgent(BaseAgent):
    """Agent trưởng - phân tích yêu cầu và giao việc cho các agent chuyên gia"""
    
    def __init__(self, api_key: str = None):
        super().__init__("Leader", api_key)
        self.available_agents = [
            "testing_agent",
            "execution_agent", 
            "reporting_agent",
            "ai_analysis_agent"
        ]
    
    def get_system_prompt(self) -> str:
        return """Bạn là Leader Agent - một Project Manager thông minh trong hệ thống TestFlow AI.

Nhiệm vụ của bạn:
1. Phân tích yêu cầu từ người dùng
2. Xác định các agent chuyên gia cần thiết để hoàn thành task
3. Phân chia task thành các subtasks phù hợp với từng agent
4. Điều phối workflow giữa các agents

Các agent chuyên gia có sẵn:
- testing_agent: Xử lý file kết quả test (JUnit XML, JSON, Playwright, PyTest...)
- execution_agent: Quản lý test runs, lưu metadata (branch, commit, author, time)
- reporting_agent: Tạo dashboard, báo cáo, biểu đồ thống kê
- ai_analysis_agent: Phân tích lỗi tự động, tóm tắt nguyên nhân, gợi ý fix

Bạn cần:
- Phân tích task một cách chi tiết
- Xác định agent nào cần tham gia
- Tạo kế hoạch thực thi rõ ràng
- Trả về JSON với format:
{
  "agents_needed": ["agent1", "agent2"],
  "workflow": [
    {"agent": "agent1", "task": "mô tả task", "input": {...}},
    {"agent": "agent2", "task": "mô tả task", "input": {...}}
  ],
  "reasoning": "Giải thích tại sao chọn các agent này và workflow này"
}"""
    
    def analyze_task(self, user_request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Phân tích task và tạo workflow
        """
        prompt = f"""Phân tích yêu cầu sau và tạo kế hoạch thực thi:

Yêu cầu: {user_request}

Context hiện tại: {context or "Không có"}

Hãy xác định:
1. Agent nào cần tham gia?
2. Thứ tự thực hiện (workflow)
3. Input cho từng agent
4. Cách kết nối output của agent này với input của agent tiếp theo

Trả về JSON với format đã mô tả trong system prompt."""
        
        response = self.call_llm(prompt, context)
        
        # Parse JSON từ response
        try:
            import json
            import re
            # Tìm JSON trong response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                plan = json.loads(json_match.group())
                return plan
            else:
                return {
                    "agents_needed": [],
                    "workflow": [],
                    "reasoning": response,
                    "error": "Không thể parse JSON từ response"
                }
        except Exception as e:
            return {
                "agents_needed": [],
                "workflow": [],
                "reasoning": response,
                "error": f"Lỗi parse JSON: {str(e)}"
            }
    
    def determine_agent_type(self, task_description: str) -> List[str]:
        """
        Xác định loại agent cần thiết dựa trên task description
        """
        task_lower = task_description.lower()
        agents = []
        
        # Keywords cho từng agent
        if any(keyword in task_lower for keyword in [
            "test result", "junit", "json", "playwright", "pytest", 
            "upload", "parse", "file test"
        ]):
            agents.append("testing_agent")
        
        if any(keyword in task_lower for keyword in [
            "test run", "execute", "save run", "metadata", 
            "branch", "commit", "author"
        ]):
            agents.append("execution_agent")
        
        if any(keyword in task_lower for keyword in [
            "dashboard", "report", "chart", "statistic", 
            "summary", "visualize", "history"
        ]):
            agents.append("reporting_agent")
        
        if any(keyword in task_lower for keyword in [
            "analyze error", "error summary", "fix suggestion", 
            "ai analysis", "group error", "flaky test",
            "analyze code", "suggest test", "test case", "test cases",
            "generate test", "code analysis", "phân tích code",
            "đề xuất test", "test scenario"
        ]):
            agents.append("ai_analysis_agent")
        
        return list(set(agents))  # Remove duplicates
    
    def process(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Xử lý task - phân tích và tạo workflow
        """
        user_request = task.get("request", "")
        context = task.get("context", {})
        
        # Phân tích với LLM
        plan = self.analyze_task(user_request, context)
        
        # Fallback: xác định agent dựa trên keywords nếu LLM fail
        if not plan.get("agents_needed") or plan.get("error"):
            agents = self.determine_agent_type(user_request)
            plan["agents_needed"] = agents
            plan["workflow"] = [{"agent": agent, "task": user_request} for agent in agents]
        
        return {
            "success": True,
            "leader_plan": plan,
            "next_step": "delegate_to_agents"
        }

