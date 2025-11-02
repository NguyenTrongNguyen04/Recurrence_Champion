"""
Leader Agent (Orchestrator) - Điều phối và phân công công việc cho các specialist agents
"""
from typing import Dict, Any, List
from .base_agent import BaseAgent


class LeaderAgent(BaseAgent):
    """Leader agent - analyzes requirements and assigns tasks to specialized agents"""
    
    def __init__(self, api_key: str = None):
        super().__init__("Leader", api_key)
        self.available_agents = [
            "testing_agent",
            "execution_agent", 
            "reporting_agent",
            "ai_analysis_agent"
        ]
    
    def get_system_prompt(self) -> str:
        return """You are Leader Agent - an intelligent Project Manager in the TestFlow AI system.

Your responsibilities:
1. Analyze user requirements
2. Identify which specialized agents are needed to complete the task
3. Break down tasks into subtasks suitable for each agent
4. Coordinate workflow between agents

Available specialized agents:
- testing_agent: Process test result files (JUnit XML, JSON, Playwright, PyTest...)
- execution_agent: Manage test runs, store metadata (branch, commit, author, time)
- reporting_agent: Create dashboards, reports, statistical charts
- ai_analysis_agent: Automatically analyze errors, summarize root causes, suggest fixes

You need to:
- Analyze tasks in detail
- Identify which agents should participate
- Create a clear execution plan
- Return JSON with format:
{
  "agents_needed": ["agent1", "agent2"],
  "workflow": [
    {"agent": "agent1", "task": "task description", "input": {...}},
    {"agent": "agent2", "task": "task description", "input": {...}}
  ],
  "reasoning": "Explanation of why these agents and workflow were chosen"
}"""
    
    def analyze_task(self, user_request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Phân tích task và tạo workflow
        """
        prompt = f"""Analyze the following request and create an execution plan:

Request: {user_request}

Current context: {context or "None"}

Please determine:
1. Which agents should participate?
2. Execution order (workflow)
3. Input for each agent
4. How to connect output of one agent to input of the next agent

Return JSON with the format described in the system prompt."""
        
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
                    "error": "Could not parse JSON from response"
                }
        except Exception as e:
            return {
                "agents_needed": [],
                "workflow": [],
                "reasoning": response,
                "error": f"JSON parse error: {str(e)}"
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

