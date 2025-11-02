"""
Test script để test các agents
"""
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from orchestrator import Orchestrator
from agents import TestingAgent, ExecutionAgent, AIAnalysisAgent

# Load API key từ environment hoặc dùng default
API_KEY = os.environ.get("CEREBRAS_API_KEY", "csk-ve6r9ehpy8knvt8yy6xmkr98jx4x6pt6f4xdftn3dedfmh6x")

def test_testing_agent():
    """Test Testing Agent với JUnit XML"""
    print("=" * 50)
    print("Testing TestingAgent...")
    print("=" * 50)
    
    agent = TestingAgent(api_key=API_KEY)
    
    # Sample JUnit XML
    junit_xml = """<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="com.example.TestSuite" tests="3" failures="1" errors="0" skipped="0" time="2.5">
    <testcase name="testLoginSuccess" classname="com.example.AuthTest" time="1.2">
    </testcase>
    <testcase name="testLoginFailure" classname="com.example.AuthTest" time="0.8">
        <failure message="Assertion failed: Expected true, got false">
            at com.example.AuthTest.testLoginFailure(AuthTest.java:42)
        </failure>
    </testcase>
    <testcase name="testRegister" classname="com.example.AuthTest" time="0.5">
    </testcase>
</testsuite>
"""
    
    result = agent.process({
        "file_content": junit_xml,
        "file_name": "test-results.xml",
        "format": "junit_xml"
    })
    
    print(f"Success: {result.get('success')}")
    if result.get("success"):
        parsed = result.get("parsed_data", {})
        print(f"Total: {parsed.get('total')}")
        print(f"Passed: {parsed.get('passed')}")
        print(f"Failed: {parsed.get('failed')}")
        print(f"Tests: {len(parsed.get('tests', []))}")
    else:
        print(f"Error: {result.get('error')}")
    
    print()


def test_execution_agent():
    """Test Execution Agent"""
    print("=" * 50)
    print("Testing ExecutionAgent...")
    print("=" * 50)
    
    agent = ExecutionAgent(api_key=API_KEY)
    
    # Mock test results
    test_results = {
        "total": 3,
        "passed": 2,
        "failed": 1,
        "skipped": 0,
        "duration": 2500,
        "tests": [
            {"name": "test1", "status": "pass", "duration": 1200},
            {"name": "test2", "status": "fail", "duration": 800},
            {"name": "test3", "status": "pass", "duration": 500}
        ]
    }
    
    metadata = {
        "branch": "main",
        "commit": "abc123",
        "author": "test@example.com",
        "project": "test-project"
    }
    
    result = agent.process({
        "action": "create_run",
        "test_results": test_results,
        "metadata": metadata
    })
    
    print(f"Success: {result.get('success')}")
    if result.get("success"):
        run = result.get("test_run", {})
        print(f"Run ID: {run.get('run_id')}")
        print(f"Total Tests: {run.get('total_tests')}")
        print(f"Pass Rate: {run.get('summary', {}).get('pass_rate')}%")
    else:
        print(f"Error: {result.get('error')}")
    
    print()


def test_ai_analysis_agent():
    """Test AI Analysis Agent"""
    print("=" * 50)
    print("Testing AIAnalysisAgent...")
    print("=" * 50)
    
    agent = AIAnalysisAgent(api_key=API_KEY)
    
    failed_test = {
        "name": "testLoginFailure",
        "status": "fail",
        "error": "Assertion failed: Expected true, got false",
        "stackTrace": "at com.example.AuthTest.testLoginFailure(AuthTest.java:42)",
        "duration": 800
    }
    
    result = agent.process({
        "action": "analyze_error",
        "test_name": failed_test["name"],
        "error_message": failed_test["error"],
        "stack_trace": failed_test["stackTrace"]
    })
    
    print(f"Success: {result.get('success')}")
    if result.get("success"):
        analysis = result.get("analysis", {})
        print(f"Test: {analysis.get('name')}")
        print(f"Cause: {analysis.get('cause')}")
        print(f"Severity: {analysis.get('severity')}")
        print(f"Suggestion: {analysis.get('suggestion')[:100]}...")
    else:
        print(f"Error: {result.get('error')}")
    
    print()


def test_orchestrator():
    """Test Orchestrator với full workflow"""
    print("=" * 50)
    print("Testing Orchestrator...")
    print("=" * 50)
    
    orchestrator = Orchestrator(api_key=API_KEY)
    
    # Test upload workflow
    junit_xml = """<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="com.example.TestSuite" tests="2" failures="1" errors="0" skipped="0" time="2.0">
    <testcase name="testPass" classname="com.example.Test" time="1.0">
    </testcase>
    <testcase name="testFail" classname="com.example.Test" time="1.0">
        <failure message="Test failed">Error details</failure>
    </testcase>
</testsuite>
"""
    
    metadata = {
        "branch": "main",
        "commit": "test123",
        "author": "test@example.com",
        "project": "test-project"
    }
    
    result = orchestrator.process_test_results_upload(
        file_content=junit_xml,
        file_name="test.xml",
        metadata=metadata
    )
    
    print(f"Success: {result.get('success')}")
    if result.get("success"):
        run = result.get("test_run", {})
        print(f"Run ID: {run.get('run_id')}")
        print(f"Total: {run.get('total_tests')}")
        print(f"Failed: {run.get('failed')}")
        if "ai_analysis" in run:
            print("AI Analysis: ✓")
    else:
        print(f"Error: {result.get('error')}")
    
    print()


if __name__ == "__main__":
    print("TestFlow AI - Agent Testing\n")
    
    # Test individual agents
    try:
        test_testing_agent()
    except Exception as e:
        print(f"Testing Agent failed: {e}\n")
    
    try:
        test_execution_agent()
    except Exception as e:
        print(f"Execution Agent failed: {e}\n")
    
    try:
        test_ai_analysis_agent()
    except Exception as e:
        print(f"AI Analysis Agent failed: {e}\n")
    
    try:
        test_orchestrator()
    except Exception as e:
        print(f"Orchestrator failed: {e}\n")
    
    print("Testing completed!")

