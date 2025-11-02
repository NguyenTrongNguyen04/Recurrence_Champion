"""
Base Agent Class - Base class cho tất cả các agents
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import os
from cerebras.cloud.sdk import Cerebras


class BaseAgent(ABC):
    """Base class cho tất cả các specialist agents"""
    
    def __init__(self, name: str, api_key: Optional[str] = None):
        self.name = name
        self.api_key = api_key or os.environ.get("CEREBRAS_API_KEY", "")
        self.client = None
        
        if self.api_key:
            self.client = Cerebras(api_key=self.api_key)
    
    @abstractmethod
    def get_system_prompt(self) -> str:
        """Trả về system prompt đặc thù cho agent này"""
        pass
    
    def call_llm(self, user_message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Gọi Cerebras LLM với user message và context
        """
        if not self.client:
            raise ValueError(f"Agent {self.name}: Cerebras client chưa được khởi tạo. Vui lòng cung cấp API key.")
        
        messages = [
            {"role": "system", "content": self.get_system_prompt()},
            {"role": "user", "content": user_message}
        ]
        
        # Thêm context nếu có
        if context:
            context_str = self._format_context(context)
            messages.append({"role": "user", "content": f"Context:\n{context_str}"})
        
        try:
            response = self.client.chat.completions.create(
                messages=messages,
                model="qwen-3-coder-480b",
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error calling LLM: {str(e)}"
    
    def _format_context(self, context: Dict[str, Any]) -> str:
        """Format context dict thành string"""
        formatted = []
        for key, value in context.items():
            formatted.append(f"{key}: {value}")
        return "\n".join(formatted)
    
    @abstractmethod
    def process(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Xử lý task cụ thể, mỗi agent implement method này
        Args:
            task: Dict chứa thông tin task cần xử lý
        Returns:
            Dict chứa kết quả xử lý
        """
        pass

