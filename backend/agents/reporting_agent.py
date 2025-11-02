"""
Reporting Agent - Tạo báo cáo, dashboard và visualization
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from .base_agent import BaseAgent


class ReportingAgent(BaseAgent):
    """Agent chuyên tạo báo cáo và dashboard"""
    
    def __init__(self, api_key: str = None):
        super().__init__("Reporting", api_key)
    
    def get_system_prompt(self) -> str:
        return """Bạn là Reporting Agent - chuyên gia tạo báo cáo và dashboard cho test results.

Nhiệm vụ của bạn:
1. Tạo dashboard tổng hợp với metrics: pass rate, fail count, total tests, duration
2. Tạo biểu đồ thống kê: Pass/Fail %, trend analysis (7 ngày), distribution
3. Tạo báo cáo chi tiết test cases với filtering và searching
4. Export reports ra các format: PDF, CSV, Excel, JSON
5. Tạo summary insights và recommendations

Bạn cần:
- Tính toán metrics chính xác
- Format dữ liệu phù hợp cho visualization
- Tạo insights có ý nghĩa từ dữ liệu
- Hỗ trợ filtering theo: branch, author, date range, status"""
    
    def generate_dashboard_summary(self, test_runs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Tạo dashboard summary từ danh sách test runs
        """
        if not test_runs:
            return {
                "metrics": {},
                "charts_data": {},
                "insights": []
            }
        
        # Lấy run mới nhất
        latest_run = test_runs[0] if test_runs else {}
        
        # Tính metrics tổng hợp
        total_runs = len(test_runs)
        total_tests = sum(run.get("total_tests", 0) for run in test_runs)
        total_passed = sum(run.get("passed", 0) for run in test_runs)
        total_failed = sum(run.get("failed", 0) for run in test_runs)
        avg_duration = sum(run.get("duration_ms", 0) for run in test_runs) / total_runs if total_runs > 0 else 0
        
        overall_pass_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        metrics = {
            "latest_pass_rate": latest_run.get("summary", {}).get("pass_rate", 0),
            "latest_failed_tests": latest_run.get("failed", 0),
            "latest_total_time": round(latest_run.get("duration_ms", 0) / 1000, 2),  # seconds
            "latest_total_tests": latest_run.get("total_tests", 0),
            "overall_pass_rate": round(overall_pass_rate, 2),
            "total_runs": total_runs,
            "avg_duration": round(avg_duration / 1000, 2)  # seconds
        }
        
        # Tạo chart data cho 7 ngày gần nhất
        last_7_days = self._get_last_7_days_data(test_runs)
        
        # Pie chart data (latest run)
        pie_data = [
            {"name": "Pass", "value": latest_run.get("passed", 0)},
            {"name": "Fail", "value": latest_run.get("failed", 0)}
        ]
        
        # Bar chart data (trend)
        bar_data = [
            {
                "name": day.get("date"),
                "pass": day.get("passed", 0),
                "fail": day.get("failed", 0)
            }
            for day in last_7_days
        ]
        
        # Generate insights với LLM
        insights = self._generate_insights(test_runs, metrics)
        
        return {
            "metrics": metrics,
            "charts_data": {
                "pie_chart": pie_data,
                "bar_chart": bar_data,
                "trend_data": last_7_days
            },
            "insights": insights
        }
    
    def generate_test_details_report(
        self,
        test_run: Dict[str, Any],
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Tạo báo cáo chi tiết test cases với filtering
        """
        filters = filters or {}
        tests = test_run.get("test_results", [])
        
        # Apply filters
        filtered_tests = self._apply_filters(tests, filters)
        
        # Group by status
        by_status = {
            "pass": [t for t in filtered_tests if t.get("status") == "pass"],
            "fail": [t for t in filtered_tests if t.get("status") == "fail"],
            "skip": [t for t in filtered_tests if t.get("status") == "skip"]
        }
        
        # Sort by duration (slowest first)
        filtered_tests_sorted = sorted(
            filtered_tests,
            key=lambda x: x.get("duration", 0),
            reverse=True
        )
        
        return {
            "run_id": test_run.get("run_id"),
            "total_tests": len(filtered_tests),
            "filtered_from": len(tests),
            "by_status": {
                "pass": len(by_status["pass"]),
                "fail": len(by_status["fail"]),
                "skip": len(by_status["skip"])
            },
            "tests": filtered_tests_sorted,
            "filters_applied": filters,
            "slowest_tests": filtered_tests_sorted[:10],  # Top 10 slowest
            "failed_tests": by_status["fail"]
        }
    
    def generate_history_report(
        self,
        test_runs: List[Dict[str, Any]],
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Tạo báo cáo lịch sử test runs
        """
        filters = filters or {}
        
        # Apply filters
        filtered_runs = self._filter_runs(test_runs, filters)
        
        # Format history items
        history_items = []
        for run in filtered_runs:
            timestamp = run.get("timestamp", "")
            date_str = self._format_date(timestamp)
            
            history_items.append({
                "run_id": run.get("run_id"),
                "tests": run.get("total_tests", 0),
                "pass": run.get("passed", 0),
                "fail": run.get("failed", 0),
                "duration": f"{round(run.get('duration_ms', 0) / 1000, 1)}s",
                "date": date_str,
                "branch": run.get("metadata", {}).get("branch", ""),
                "author": run.get("metadata", {}).get("author", "")
            })
        
        return {
            "total_runs": len(filtered_runs),
            "filtered_from": len(test_runs),
            "history": history_items,
            "filters_applied": filters
        }
    
    def _get_last_7_days_data(self, test_runs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Lấy dữ liệu 7 ngày gần nhất"""
        # Group by date
        by_date = {}
        today = datetime.now()
        
        for run in test_runs:
            timestamp = run.get("timestamp", "")
            if timestamp:
                try:
                    run_date = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                    date_key = run_date.strftime("%Y-%m-%d")
                    
                    if date_key not in by_date:
                        by_date[date_key] = {
                            "date": date_key,
                            "passed": 0,
                            "failed": 0,
                            "total": 0
                        }
                    
                    by_date[date_key]["passed"] += run.get("passed", 0)
                    by_date[date_key]["failed"] += run.get("failed", 0)
                    by_date[date_key]["total"] += run.get("total_tests", 0)
                except:
                    continue
        
        # Fill missing dates với 0
        result = []
        for i in range(6, -1, -1):  # Last 7 days
            date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            if date in by_date:
                result.append(by_date[date])
            else:
                result.append({
                    "date": date,
                    "passed": 0,
                    "failed": 0,
                    "total": 0
                })
        
        return result
    
    def _apply_filters(
        self,
        tests: List[Dict[str, Any]],
        filters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Áp dụng filters cho test cases"""
        filtered = tests
        
        # Filter by status
        if "status" in filters:
            status_filter = filters["status"]
            if isinstance(status_filter, str):
                status_filter = [status_filter]
            filtered = [t for t in filtered if t.get("status") in status_filter]
        
        # Filter by category
        if "category" in filters:
            category_filter = filters["category"]
            if isinstance(category_filter, str):
                category_filter = [category_filter]
            filtered = [t for t in filtered if t.get("category") in category_filter]
        
        # Search by name
        if "search" in filters:
            search_term = filters["search"].lower()
            filtered = [
                t for t in filtered
                if search_term in t.get("name", "").lower()
            ]
        
        # Filter by duration (min/max)
        if "min_duration" in filters:
            min_dur = filters["min_duration"]
            filtered = [t for t in filtered if t.get("duration", 0) >= min_dur]
        
        if "max_duration" in filters:
            max_dur = filters["max_duration"]
            filtered = [t for t in filtered if t.get("duration", 0) <= max_dur]
        
        return filtered
    
    def _filter_runs(
        self,
        runs: List[Dict[str, Any]],
        filters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Filter test runs"""
        filtered = runs
        
        # Filter by branch
        if "branch" in filters:
            branch = filters["branch"]
            filtered = [
                r for r in filtered
                if r.get("metadata", {}).get("branch") == branch
            ]
        
        # Filter by author
        if "author" in filters:
            author = filters["author"]
            filtered = [
                r for r in filtered
                if r.get("metadata", {}).get("author") == author
            ]
        
        # Filter by date range
        if "date_from" in filters or "date_to" in filters:
            date_from = filters.get("date_from")
            date_to = filters.get("date_to")
            
            def in_range(run):
                timestamp = run.get("timestamp", "")
                if not timestamp:
                    return False
                try:
                    run_date = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                    if date_from and run_date < datetime.fromisoformat(date_from):
                        return False
                    if date_to and run_date > datetime.fromisoformat(date_to):
                        return False
                    return True
                except:
                    return False
            
            filtered = [r for r in filtered if in_range(r)]
        
        return filtered
    
    def _generate_insights(
        self,
        test_runs: List[Dict[str, Any]],
        metrics: Dict[str, Any]
    ) -> List[str]:
        """Generate insights với LLM"""
        if len(test_runs) < 2:
            return ["Cần thêm dữ liệu để tạo insights"]
        
        # Tạo summary string
        summary = f"""
Tổng số runs: {metrics.get('total_runs')}
Pass rate trung bình: {metrics.get('overall_pass_rate')}%
Thời gian trung bình: {metrics.get('avg_duration')}s
"""
        
        # So sánh run mới nhất với run trước
        latest = test_runs[0]
        previous = test_runs[1] if len(test_runs) > 1 else None
        
        if previous:
            latest_pass_rate = latest.get("summary", {}).get("pass_rate", 0)
            prev_pass_rate = previous.get("summary", {}).get("pass_rate", 0)
            change = latest_pass_rate - prev_pass_rate
            
            if change < 0:
                summary += f"\n⚠️ Pass rate giảm {abs(change):.2f}% so với run trước"
            elif change > 0:
                summary += f"\n✅ Pass rate tăng {change:.2f}% so với run trước"
        
        prompt = f"""Phân tích dữ liệu test runs sau và đưa ra 3-5 insights quan trọng nhất:

{summary}

Hãy đưa ra insights về:
1. Xu hướng chất lượng test
2. Vấn đề cần chú ý
3. Khuyến nghị cải thiện

Trả về dạng list các insights (mỗi insight một dòng, ngắn gọn)."""
        
        response = self.call_llm(prompt)
        insights = [line.strip() for line in response.split("\n") if line.strip() and line.strip().startswith(("1", "2", "3", "4", "5", "-", "•"))]
        
        if not insights:
            insights = [response]  # Fallback to full response
        
        return insights[:5]  # Limit to 5 insights
    
    def _format_date(self, timestamp: str) -> str:
        """Format timestamp thành readable date"""
        try:
            dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            return dt.strftime("%Y-%m-%d %H:%M")
        except:
            return timestamp
    
    def process(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Xử lý task - tạo báo cáo
        """
        report_type = task.get("report_type", "dashboard")
        
        if report_type == "dashboard":
            test_runs = task.get("test_runs", [])
            summary = self.generate_dashboard_summary(test_runs)
            return {
                "success": True,
                "report_type": "dashboard",
                "data": summary
            }
        
        elif report_type == "test_details":
            test_run = task.get("test_run", {})
            filters = task.get("filters", {})
            report = self.generate_test_details_report(test_run, filters)
            return {
                "success": True,
                "report_type": "test_details",
                "data": report
            }
        
        elif report_type == "history":
            test_runs = task.get("test_runs", [])
            filters = task.get("filters", {})
            report = self.generate_history_report(test_runs, filters)
            return {
                "success": True,
                "report_type": "history",
                "data": report
            }
        
        else:
            return {
                "success": False,
                "error": f"Unknown report type: {report_type}"
            }

