"""
API Server - FastAPI server để kết nối frontend với agents
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
import os
import sys
import json

# Add parent directory to path để import agents
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from orchestrator import Orchestrator
from config import Config
from utils.github_client import GitHubClient
from utils.response_parser import ResponseParser

app = FastAPI(title="TestFlow AI API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize orchestrator
orchestrator = Orchestrator(api_key=Config.CEREBRAS_API_KEY)


def verify_token(authorization: Optional[str] = Header(None)):
    """Verify upload token"""
    if Config.UPLOAD_TOKEN:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing authorization token")
        token = authorization.replace("Bearer ", "")
        if token != Config.UPLOAD_TOKEN:
            raise HTTPException(status_code=403, detail="Invalid token")
    return True


@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "ok",
        "service": "TestFlow AI API",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.post("/api/upload")
async def upload_test_results(
    file: UploadFile = File(...),
    branch: Optional[str] = None,
    commit: Optional[str] = None,
    author: Optional[str] = None,
    project: Optional[str] = "default",
    _: bool = Depends(verify_token)
):
    """
    Upload test results file từ CI/CD hoặc manual
    
    Headers:
        Authorization: Bearer <token>
    
    Form data:
        file: Test results file (JUnit XML, JSON, etc.)
        branch: Git branch name
        commit: Git commit hash
        author: Author name/email
        project: Project name
    """
    try:
        # Read file content
        content = await file.read()
        
        # Validate file size
        if len(content) > Config.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size: {Config.MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        file_content = content.decode("utf-8")
        
        # Prepare metadata
        metadata = {
            "branch": branch or "unknown",
            "commit": commit or "",
            "author": author or "unknown",
            "project": project,
            "trigger": "ci_cd",
            "file_name": file.filename
        }
        
        # Process với orchestrator
        result = orchestrator.process_test_results_upload(
            file_content=file_content,
            file_name=file.filename,
            metadata=metadata
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to process test results")
            )
        
        return JSONResponse(content={
            "success": True,
            "message": "Test results uploaded successfully",
            "data": {
                "run_id": result.get("test_run", {}).get("run_id"),
                "total_tests": result.get("test_run", {}).get("total_tests"),
                "passed": result.get("test_run", {}).get("passed"),
                "failed": result.get("test_run", {}).get("failed")
            }
        })
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/analyze")
async def analyze_with_ai(
    request: dict
):
    """
    Phân tích request với AI agents
    
    Body:
        {
            "request": "user request string",
            "context": {...} (optional)
        }
    """
    try:
        user_request = request.get("request", "")
        context = request.get("context", {})
        
        if not user_request:
            raise HTTPException(status_code=400, detail="Missing 'request' field")
        
        result = orchestrator.process_request(user_request, context)
        
        return JSONResponse(content=result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/dashboard")
async def get_dashboard(
    request: dict
):
    """
    Lấy dashboard data
    
    Body:
        {
            "test_runs": [...],  # List test runs
            "filters": {...} (optional)
        }
    """
    try:
        test_runs = request.get("test_runs", [])
        filters = request.get("filters")
        
        result = orchestrator.get_dashboard_data(test_runs, filters)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to generate dashboard")
            )
        
        return JSONResponse(content=result.get("data", {}))
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/analyze-errors")
async def analyze_errors(
    request: dict
):
    """
    Phân tích lỗi của test run
    
    Body:
        {
            "test_run": {...}  # Test run object
        }
    """
    try:
        test_run = request.get("test_run", {})
        
        if not test_run:
            raise HTTPException(status_code=400, detail="Missing 'test_run' field")
        
        result = orchestrator.analyze_test_errors(test_run)
        
        return JSONResponse(content=result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/analyze-github")
async def analyze_github_url(
    request: dict
):
    """
    Phân tích code từ GitHub URL
    
    Body:
        {
            "github_url": "https://github.com/owner/repo",
            "branch": "main" (optional),
            "path": "src/" (optional),
            "max_files": 20 (optional)
        }
    """
    try:
        github_url = request.get("github_url", "")
        branch = request.get("branch")
        path = request.get("path", "")
        max_files = request.get("max_files", 20)
        
        if not github_url:
            raise HTTPException(status_code=400, detail="Missing 'github_url' field")
        
        # Fetch code từ GitHub
        github_client = GitHubClient(token=os.environ.get("GITHUB_TOKEN"))
        github_data = github_client.fetch_from_url(github_url, max_files)
        
        if "error" in github_data:
            raise HTTPException(status_code=400, detail=github_data["error"])
        
        # Combine tất cả code content
        all_code = []
        detected_languages = set()
        
        for file in github_data.get("files", []):
            if "content" in file and "error" not in file:
                file_name = file.get("name", "")
                file_ext = os.path.splitext(file_name)[1]
                
                # Detect language từ extension
                lang_map = {
                    ".js": "javascript", ".ts": "typescript", ".jsx": "javascript",
                    ".tsx": "typescript", ".py": "python", ".java": "java",
                    ".go": "go", ".rs": "rust", ".cpp": "cpp", ".c": "c"
                }
                language = lang_map.get(file_ext, "unknown")
                if language != "unknown":
                    detected_languages.add(language)
                
                all_code.append(f"// File: {file.get('path', file_name)}\n{file.get('content', '')}")
        
        # Analyze với AI
        code_content = "\n\n".join(all_code)
        languages_str = ", ".join(detected_languages) if detected_languages else "unknown"
        
        user_request = f"""Phân tích codebase sau từ GitHub repository {github_url}:

Languages detected: {languages_str}

Code:
{code_content[:10000]}  # Limit để tránh token limit

Hãy:
1. Phân tích cấu trúc code
2. Đề xuất test cases cho các functions chính
3. Xác định rủi ro tiềm ẩn
4. Gợi ý improvements

QUAN TRỌNG: Trả về kết quả dưới dạng JSON với format sau:
{{
  "summary": {{
    "overview": "Mô tả tổng quan về codebase",
    "risks": ["Risk 1", "Risk 2", ...]
  }},
  "testCases": [
    {{
      "id": 1,
      "title": "Tên test case",
      "name": "Test case name",
      "function": "Tên function/class cần test",
      "type": "unit|integration|negative|edge",
      "complexity": "S|M|L",
      "description": "Mô tả test case",
      "steps": ["Bước 1", "Bước 2", ...],
      "expectedResult": "Kết quả mong đợi"
    }}
  ]
}}"""
        
        context = {
            "source": "github",
            "url": github_url,
            "owner": github_data.get("owner"),
            "repo": github_data.get("repo"),
            "branch": github_data.get("branch"),
            "files_analyzed": len(github_data.get("files", [])),
            "detected_languages": list(detected_languages),
            "code": code_content[:15000]  # Lưu code thực sự vào context
        }
        
        result = orchestrator.process_request(user_request, context)
        
        # Parse AI response để extract structured data
        ai_response_text = ""
        if result.get("final_output"):
            final_output = result.get("final_output")
            if isinstance(final_output, dict):
                ai_response_text = final_output.get("result", "") or final_output.get("content", "") or json.dumps(final_output)
            else:
                ai_response_text = str(final_output)
        elif result.get("workflow_results"):
            # Extract từ workflow results
            for workflow_result in result.get("workflow_results", []):
                if workflow_result.get("step") == "ai_analysis_agent":
                    agent_result = workflow_result.get("result", {})
                    if agent_result.get("analysis"):
                        ai_response_text = json.dumps(agent_result.get("analysis"))
                        break
        
        # Parse structured response
        parsed_response = ResponseParser.parse_ai_response(ai_response_text) if ai_response_text else {}
        
        # Combine results
        return JSONResponse(content={
            "success": True,
            "github_data": github_data,
            "analysis": result,
            "parsed_response": parsed_response,  # Thêm parsed response với test cases
            "summary": {
                "total_files": len(github_data.get("files", [])),
                "detected_languages": list(detected_languages),
                "repo_info": {
                    "owner": github_data.get("owner"),
                    "repo": github_data.get("repo"),
                    "branch": github_data.get("branch")
                }
            }
        })
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/analyze-code")
async def analyze_code_snippet(
    request: dict
):
    """
    Phân tích code snippet từ user input
    
    Body:
        {
            "code": "code snippet here",
            "language": "javascript" (optional),
            "context": {...} (optional)
        }
    """
    try:
        code = request.get("code", "")
        language = request.get("language", "unknown")
        context_data = request.get("context", {})
        
        if not code:
            raise HTTPException(status_code=400, detail="Missing 'code' field")
        
        # Analyze với AI - yêu cầu format JSON chuẩn
        user_request = f"""Phân tích đoạn code sau và đề xuất test cases:

Language: {language}

Code:
{code}

Hãy:
1. Phân tích logic và chức năng của code
2. Đề xuất test cases: unit tests, integration tests, edge cases
3. Xác định potential bugs hoặc issues
4. Đề xuất improvements nếu có

QUAN TRỌNG: Trả về kết quả dưới dạng JSON với format sau:
{{
  "summary": {{
    "overview": "Mô tả tổng quan về code",
    "risks": ["Risk 1", "Risk 2", ...]
  }},
  "testCases": [
    {{
      "id": 1,
      "title": "Tên test case",
      "name": "Test case name",
      "function": "Tên function/class cần test",
      "type": "unit|integration|negative|edge",
      "complexity": "S|M|L",
      "description": "Mô tả test case",
      "steps": ["Bước 1", "Bước 2", ...],
      "expectedResult": "Kết quả mong đợi"
    }}
  ]
}}"""
        
        context = {
            "source": "code_snippet",
            "language": language,
            "code_length": len(code),
            "code": code,  # Lưu code thực sự vào context
            **context_data
        }
        
        result = orchestrator.process_request(user_request, context)
        
        # Parse AI response để extract structured data
        ai_response_text = ""
        
        # Ưu tiên 1: Từ ai_response_text trong result
        if result.get("ai_response_text"):
            ai_response_text = result.get("ai_response_text")
        # Ưu tiên 2: Từ final_output
        elif result.get("final_output"):
            final_output = result.get("final_output")
            if isinstance(final_output, dict):
                if "result" in final_output and isinstance(final_output.get("result"), dict):
                    ai_response_text = json.dumps(final_output.get("result"))
                elif "testCases" in final_output:
                    ai_response_text = json.dumps(final_output)
                else:
                    ai_response_text = final_output.get("content", "") or json.dumps(final_output)
            else:
                ai_response_text = str(final_output)
        # Ưu tiên 3: Từ workflow_results
        elif result.get("workflow_results"):
            for workflow_result in result.get("workflow_results", []):
                if workflow_result.get("step") == "ai_analysis_agent":
                    agent_result = workflow_result.get("result", {})
                    if agent_result.get("result"):
                        ai_response_text = json.dumps(agent_result.get("result"))
                    elif agent_result.get("testCases"):
                        ai_response_text = json.dumps(agent_result)
                    elif agent_result.get("content"):
                        ai_response_text = agent_result.get("content")
                    break
        
        # Parse structured response
        parsed_response = {}
        if ai_response_text:
            try:
                parsed_direct = json.loads(ai_response_text)
                if isinstance(parsed_direct, dict) and ("testCases" in parsed_direct or "summary" in parsed_direct):
                    parsed_response = parsed_direct
                else:
                    parsed_response = ResponseParser.parse_ai_response(ai_response_text)
            except:
                parsed_response = ResponseParser.parse_ai_response(ai_response_text)
        
        return JSONResponse(content={
            "success": True,
            "code_info": {
                "language": language,
                "length": len(code),
                "lines": len(code.split("\n"))
            },
            "analysis": result,
            "parsed_response": parsed_response  # Thêm parsed response với test cases
        })
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/analyze-files")
async def analyze_code_files(
    files: List[UploadFile] = File(...),
    language: Optional[str] = None
):
    """
    Phân tích code files được upload
    
    Form data:
        files: Multiple code files
        language: Optional language hint
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # Read all files
        all_code = []
        detected_languages = set()
        file_info = []
        
        for file in files:
            content = await file.read()
            
            # Validate size
            if len(content) > Config.MAX_FILE_SIZE:
                file_info.append({
                    "name": file.filename,
                    "error": f"File too large (max {Config.MAX_FILE_SIZE / 1024 / 1024}MB)"
                })
                continue
            
            try:
                code_content = content.decode("utf-8")
            except:
                file_info.append({
                    "name": file.filename,
                    "error": "File encoding not supported (must be UTF-8)"
                })
                continue
            
            # Detect language
            file_ext = os.path.splitext(file.filename)[1]
            lang_map = {
                ".js": "javascript", ".ts": "typescript", ".jsx": "javascript",
                ".tsx": "typescript", ".py": "python", ".java": "java",
                ".go": "go", ".rs": "rust", ".cpp": "cpp", ".c": "c",
                ".cs": "csharp", ".php": "php", ".rb": "ruby"
            }
            file_language = lang_map.get(file_ext, language or "unknown")
            if file_language != "unknown":
                detected_languages.add(file_language)
            
            all_code.append(f"// File: {file.filename}\n{code_content}")
            file_info.append({
                "name": file.filename,
                "size": len(content),
                "language": file_language,
                "lines": len(code_content.split("\n"))
            })
        
        if not all_code:
            raise HTTPException(status_code=400, detail="No valid code files to analyze")
        
        # Combine và analyze
        combined_code = "\n\n".join(all_code)
        languages_str = ", ".join(detected_languages) if detected_languages else language or "unknown"
        
        user_request = f"""Phân tích các file code sau:

Languages detected: {languages_str}
Total files: {len(all_code)}

Code:
{combined_code[:15000]}  # Limit để tránh token limit

Hãy:
1. Phân tích cấu trúc và logic của code
2. Đề xuất test cases cho các functions/chức năng chính
3. Xác định potential bugs, security issues
4. Đề xuất improvements và best practices

QUAN TRỌNG: Trả về kết quả dưới dạng JSON với format sau:
{{
  "summary": {{
    "overview": "Mô tả tổng quan về code",
    "risks": ["Risk 1", "Risk 2", ...]
  }},
  "testCases": [
    {{
      "id": 1,
      "title": "Tên test case",
      "name": "Test case name",
      "function": "Tên function/class cần test",
      "type": "unit|integration|negative|edge",
      "complexity": "S|M|L",
      "description": "Mô tả test case",
      "steps": ["Bước 1", "Bước 2", ...],
      "expectedResult": "Kết quả mong đợi"
    }}
  ]
}}"""
        
        context = {
            "source": "uploaded_files",
            "total_files": len(all_code),
            "file_info": file_info,
            "detected_languages": list(detected_languages) if detected_languages else [language] if language else [],
            "code": combined_code[:15000]  # Lưu code thực sự vào context
        }
        
        result = orchestrator.process_request(user_request, context)
        
        # Parse AI response để extract structured data
        ai_response_text = ""
        parsed_response = {}
        
        # Ưu tiên 1: Từ ai_response_text trong result
        if result.get("ai_response_text"):
            ai_response_text = result.get("ai_response_text")
            print(f"[DEBUG analyze-files] Using ai_response_text: {ai_response_text[:200]}")
        # Ưu tiên 2: Từ final_output
        elif result.get("final_output"):
            final_output = result.get("final_output")
            print(f"[DEBUG analyze-files] final_output type: {type(final_output)}")
            if isinstance(final_output, dict):
                # Nếu final_output có result với testCases
                if "result" in final_output and isinstance(final_output.get("result"), dict):
                    result_data = final_output.get("result")
                    print(f"[DEBUG analyze-files] final_output.result keys: {result_data.keys()}")
                    if "testCases" in result_data:
                        parsed_response = result_data
                        print(f"[DEBUG analyze-files] Found testCases in result: {len(result_data.get('testCases', []))}")
                    else:
                        ai_response_text = json.dumps(result_data)
                elif "testCases" in final_output:
                    parsed_response = final_output
                    print(f"[DEBUG analyze-files] Found testCases directly: {len(final_output.get('testCases', []))}")
                elif "content" in final_output:
                    ai_response_text = final_output.get("content", "")
                else:
                    ai_response_text = json.dumps(final_output)
            else:
                ai_response_text = str(final_output)
        # Ưu tiên 3: Từ workflow_results
        elif result.get("workflow_results"):
            for workflow_result in result.get("workflow_results", []):
                if workflow_result.get("step") == "ai_analysis_agent":
                    agent_result = workflow_result.get("result", {})
                    print(f"[DEBUG analyze-files] agent_result keys: {agent_result.keys()}")
                    
                    # Check result.testCases first
                    if agent_result.get("result") and isinstance(agent_result.get("result"), dict):
                        result_data = agent_result.get("result")
                        if "testCases" in result_data:
                            parsed_response = result_data
                            print(f"[DEBUG analyze-files] Found testCases in agent_result.result: {len(result_data.get('testCases', []))}")
                            break
                    
                    if agent_result.get("testCases"):
                        parsed_response = agent_result
                        print(f"[DEBUG analyze-files] Found testCases directly in agent_result: {len(agent_result.get('testCases', []))}")
                        break
                    
                    if agent_result.get("result"):
                        ai_response_text = json.dumps(agent_result.get("result"))
                    elif agent_result.get("content"):
                        ai_response_text = agent_result.get("content")
                    break
        
        # Parse structured response nếu chưa có
        if not parsed_response and ai_response_text:
            try:
                parsed_direct = json.loads(ai_response_text)
                if isinstance(parsed_direct, dict) and ("testCases" in parsed_direct or "summary" in parsed_direct):
                    parsed_response = parsed_direct
                    print(f"[DEBUG analyze-files] Parsed from ai_response_text: testCases={len(parsed_response.get('testCases', []))}")
                else:
                    parsed_response = ResponseParser.parse_ai_response(ai_response_text)
                    print(f"[DEBUG analyze-files] Parsed with ResponseParser: testCases={len(parsed_response.get('testCases', []))}")
            except Exception as e:
                print(f"[DEBUG analyze-files] Error parsing ai_response_text: {e}")
                parsed_response = ResponseParser.parse_ai_response(ai_response_text)
                print(f"[DEBUG analyze-files] Parsed with ResponseParser (fallback): testCases={len(parsed_response.get('testCases', []))}")
        
        # Ensure parsed_response has testCases array
        if "testCases" not in parsed_response:
            parsed_response["testCases"] = []
        print(f"[DEBUG analyze-files] Final parsed_response.testCases count: {len(parsed_response.get('testCases', []))}")
        
        return JSONResponse(content={
            "success": True,
            "files_info": file_info,
            "detected_languages": list(detected_languages) if detected_languages else [language] if language else [],
            "analysis": result,
            "parsed_response": parsed_response  # Thêm parsed response với test cases
        })
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/execute-tests")
async def execute_tests(
    request: dict
):
    """
    Execute test cases - Generate test code và chạy tests
    
    Body:
        {
            "test_cases": [
                {
                    "id": 1,
                    "name": "test case name",
                    "function": "function name",
                    "type": "unit",
                    "complexity": "S",
                    ...
                }
            ],
            "original_code": "original source code (optional)",
            "language": "java",
            "framework": "JUnit (optional)"
        }
    """
    try:
        test_cases = request.get("test_cases", [])
        original_code = request.get("original_code", "")
        language = request.get("language", "unknown")
        framework = request.get("framework", None)
        risks = request.get("risks", [])  # Get risks from analysis
        
        if not test_cases:
            raise HTTPException(status_code=400, detail="Missing 'test_cases' field")
        
        # Step 1: Generate test code với AI Analysis Agent
        ai_agent = orchestrator.agents["ai_analysis_agent"]
        generate_result = ai_agent.process({
            "action": "generate_test_code",
            "test_cases": test_cases,
            "original_code": original_code,
            "language": language,
            "framework": framework
        })
        
        if not generate_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate test code: {generate_result.get('error', 'Unknown error')}"
            )
        
        generated_code_data = generate_result.get("generated_code", {})
        test_code = generated_code_data.get("testCode", "")
        detected_framework = generate_result.get("framework", framework or "custom")
        
        if not test_code:
            raise HTTPException(status_code=500, detail="Generated test code is empty")
        
        # Step 2: Execute test code với Execution Agent - truyền risks và original_code vào
        execution_agent = orchestrator.agents["execution_agent"]
        execute_result = execution_agent.process({
            "action": "execute_test_code",
            "test_code": test_code,
            "original_code": original_code,  # Truyền original_code để có thể combine khi execute
            "framework": detected_framework,
            "language": language,
            "test_cases": test_cases,
            "risks": risks  # Truyền risks vào execution agent
        })
        
        if not execute_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Failed to execute tests: {execute_result.get('error', 'Unknown error')}"
            )
        
        # Combine results
        return JSONResponse(content={
            "success": True,
            "generated_code": {
                "code": test_code,
                "framework": detected_framework,
                "file_extension": generated_code_data.get("fileExtension", ""),
                "dependencies": generated_code_data.get("dependencies", [])
            },
            "execution": {
                "run_id": execute_result.get("run_id"),
                "total": execute_result.get("total"),
                "passed": execute_result.get("passed"),
                "failed": execute_result.get("failed"),
                "durationMs": execute_result.get("durationMs"),
                "results": execute_result.get("results", []),
                "executed_at": execute_result.get("executed_at")
            },
            "summary": {
                "language": language,
                "framework": detected_framework,
                "test_cases_count": len(test_cases)
            }
        })
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api_server:app",
        host=Config.API_HOST,
        port=Config.API_PORT,
        reload=True
    )

