"""
Response Parser - Parse AI response và extract structured data
"""
import json
import re
from typing import Dict, Any, List, Optional


class ResponseParser:
    """Parse AI response và extract structured data"""
    
    @staticmethod
    def parse_ai_response(response: str) -> Dict[str, Any]:
        """
        Parse AI response và extract test cases, summary
        
        Args:
            response: AI response string (có thể là JSON hoặc text)
            
        Returns:
            Dict với format:
            {
                "summary": {
                    "overview": "...",
                    "risks": [...]
                },
                "testCases": [...]
            }
        """
        try:
            # Thử parse JSON trực tiếp
            parsed = json.loads(response)
            if isinstance(parsed, dict):
                # Validate parsed response - filter out error analysis objects
                parsed = ResponseParser._clean_parsed_response(parsed)
                return parsed
        except:
            pass
        
        # Tìm JSON block trong response - ưu tiên testCases format
        json_patterns = [
            r'\{[\s\S]*"testCases"[\s\S]*?\}',  # Test cases format
            r'\{[\s\S]*"summary"[\s\S]*?"testCases"[\s\S]*?\}',  # Full format với summary và testCases
            r'```json\s*(\{[\s\S]*"testCases"[\s\S]*?\})\s*```',
            r'```\s*(\{[\s\S]*"testCases"[\s\S]*?\})\s*```',
            r'\{[\s\S]*"summary"[\s\S]*?\}',  # Fallback: chỉ summary
            r'```json\s*(\{[\s\S]*\})\s*```',  # Fallback: any JSON
            r'```\s*(\{[\s\S]*\})\s*```'  # Fallback: any JSON
        ]
        
        for pattern in json_patterns:
            match = re.search(pattern, response, re.IGNORECASE | re.DOTALL)
            if match:
                try:
                    json_str = match.group(1) if match.lastindex else match.group(0)
                    parsed = json.loads(json_str)
                    if isinstance(parsed, dict):
                        # Clean parsed response trước khi return
                        parsed = ResponseParser._clean_parsed_response(parsed)
                        # Chỉ return nếu có testCases (hoặc summary cho fallback)
                        if "testCases" in parsed or "summary" in parsed:
                            return parsed
                except:
                    continue
        
        # Nếu không tìm thấy JSON, parse text response
        return ResponseParser._parse_text_response(response)
    
    @staticmethod
    def _parse_text_response(text: str) -> Dict[str, Any]:
        """Parse text response để extract test cases"""
        lines = text.split('\n')
        test_cases: List[Dict[str, Any]] = []
        summary = {
            "overview": "",
            "risks": []
        }
        
        current_section = None
        overview_lines = []
        risk_lines = []
        
        for i, line in enumerate(lines):
            line_lower = line.lower().strip()
            
            # Detect sections
            if 'summary' in line_lower or 'overview' in line_lower:
                current_section = 'summary'
                continue
            elif 'risk' in line_lower:
                current_section = 'risk'
                continue
            elif 'test case' in line_lower or 'test:' in line_lower:
                current_section = 'test'
                
                # Extract test case info
                test_case = ResponseParser._extract_test_case_from_line(line, i)
                if test_case:
                    test_cases.append(test_case)
                continue
            
            # Collect content
            if current_section == 'summary' and line.strip():
                overview_lines.append(line.strip())
            elif current_section == 'risk' and line.strip():
                if not line.strip().startswith('-') and not line.strip().startswith('*'):
                    risk_lines.append(line.strip())
            
            # Try to detect test cases in any line
            if ('test' in line_lower or 'should' in line_lower) and 'case' in line_lower:
                test_case = ResponseParser._extract_test_case_from_line(line, i)
                if test_case:
                    test_cases.append(test_case)
        
        summary["overview"] = " ".join(overview_lines[:200]) if overview_lines else "Code analysis completed."
        summary["risks"] = risk_lines[:5] if risk_lines else []
        
        # Nếu không có test cases, tạo từ lines có "test"
        if not test_cases:
            for i, line in enumerate(lines):
                if 'test' in line.lower() and len(line.strip()) > 10:
                    test_cases.append({
                        "id": len(test_cases) + 1,
                        "title": line.strip()[:100],
                        "name": line.strip()[:100],
                        "function": "unknown",
                        "type": "unit",
                        "complexity": "M"
                    })
        
        return {
            "summary": summary,
            "testCases": ResponseParser._clean_test_cases(test_cases[:20])  # Limit to 20 test cases
        }
    
    @staticmethod
    def _clean_parsed_response(parsed: Dict[str, Any]) -> Dict[str, Any]:
        """Clean parsed response - filter out error analysis objects from test cases"""
        if "testCases" in parsed and isinstance(parsed["testCases"], list):
            parsed["testCases"] = ResponseParser._clean_test_cases(parsed["testCases"])
        return parsed
    
    @staticmethod
    def _clean_test_cases(test_cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter out error analysis objects and ensure valid test cases"""
        import logging
        cleaned = []
        original_count = len(test_cases)
        
        for idx, tc in enumerate(test_cases):
            if not isinstance(tc, dict):
                logging.debug(f"Test case {idx}: Not a dict, skipping")
                continue
            
            # Skip nếu có error analysis fields (cause, suggestion) nhưng không có title/name hợp lệ
            has_error_fields = "cause" in tc or "suggestion" in tc or "severity" in tc
            has_valid_name = ("title" in tc and isinstance(tc["title"], str) and len(tc["title"]) > 3) or \
                           ("name" in tc and isinstance(tc["name"], str) and len(tc["name"]) > 3)
            
            # Nếu có error fields nhưng không có valid name, skip
            if has_error_fields and not has_valid_name:
                logging.debug(f"Test case {idx}: Has error fields but no valid name, skipping")
                continue
            
            # Ensure test case có ít nhất title hoặc name
            if "title" not in tc and "name" not in tc:
                # Nếu có error fields, skip vì đây là error analysis object
                if has_error_fields:
                    logging.debug(f"Test case {idx}: No title/name and has error fields, skipping")
                    continue
                # Nếu không có gì, skip
                logging.debug(f"Test case {idx}: No title/name, skipping")
                continue
            
            # Validate name/title không phải là raw JSON
            name_value = tc.get("title") or tc.get("name") or ""
            if isinstance(name_value, str):
                name_str = name_value.strip()
                # Skip nếu là raw JSON object
                if name_str.startswith("{") or name_str.startswith("[") or \
                   ("'cause'" in name_str or "'suggestion'" in name_str or '"cause"' in name_str or '"suggestion"' in name_str):
                    logging.debug(f"Test case {idx}: Name is raw JSON, skipping: {name_str[:50]}")
                    continue
            elif name_value is not None:
                # Nếu name_value không phải string, try convert hoặc skip
                try:
                    tc["title"] = str(name_value)
                    tc["name"] = str(name_value)
                except:
                    logging.debug(f"Test case {idx}: Name is not string and cannot convert, skipping")
                    continue
            
            # Ensure function field là string
            if "function" not in tc:
                tc["function"] = "unknown"
            elif not isinstance(tc.get("function"), str):
                tc["function"] = str(tc.get("function", "unknown"))
            
            # Ensure type và complexity
            if "type" not in tc:
                tc["type"] = "unit"
            if "complexity" not in tc:
                tc["complexity"] = "M"
            
            cleaned.append(tc)
            logging.debug(f"Test case {idx}: Added - title={tc.get('title', 'N/A')[:50]}, function={tc.get('function')}")
        
        logging.info(f"Cleaned test cases: {len(cleaned)}/{original_count} passed validation")
        return cleaned
    
    @staticmethod
    def _extract_test_case_from_line(line: str, index: int) -> Optional[Dict[str, Any]]:
        """Extract test case info từ một dòng text"""
        line = line.strip()
        
        # Skip empty lines or too short
        if len(line) < 10:
            return None
        
        # Skip nếu là markdown formatting
        if line.startswith('#') or line.startswith('```'):
            return None
        
        # Detect test case patterns
        test_patterns = [
            r'(\d+)[\.\)]\s*(.+?)(?:should|test|verify)',
            r'(?:test|should|verify)\s*[:\-]?\s*(.+)',
            r'(.+?)\s*-\s*(?:test|should|verify)'
        ]
        
        for pattern in test_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                title = match.group(2) if match.lastindex >= 2 else match.group(1)
                title = title.strip()
                
                if len(title) > 5:
                    # Detect type
                    test_type = "unit"
                    if "integration" in line.lower():
                        test_type = "integration"
                    elif "negative" in line.lower() or "fail" in line.lower() or "error" in line.lower():
                        test_type = "negative"
                    elif "edge" in line.lower() or "boundary" in line.lower():
                        test_type = "edge"
                    
                    # Detect complexity
                    complexity = "M"
                    if "simple" in line.lower() or "basic" in line.lower():
                        complexity = "S"
                    elif "complex" in line.lower() or "advanced" in line.lower():
                        complexity = "L"
                    
                    return {
                        "id": index + 1,
                        "title": title[:100],
                        "name": title[:100],
                        "function": "unknown",
                        "type": test_type,
                        "complexity": complexity
                    }
        
        return None

