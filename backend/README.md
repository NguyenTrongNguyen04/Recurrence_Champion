# TestFlow AI Backend - Multi-Agent System

Backend API server với hệ thống đa agent (multi-agent system) để xử lý test results và phân tích với AI.

## Kiến trúc

### Agents

1. **LeaderAgent** (Orchestrator): Phân tích yêu cầu và điều phối workflow
2. **TestingAgent**: Parse và xử lý file test results (JUnit XML, JSON, Playwright, Jest...)
3. **ExecutionAgent**: Quản lý test runs, lưu metadata
4. **ReportingAgent**: Tạo dashboard, báo cáo, visualization
5. **AIAnalysisAgent**: Phân tích lỗi với AI, tóm tắt và gợi ý fix

### Workflow

```
User Request
    ↓
Leader Agent (phân tích và tạo plan)
    ↓
Specialist Agents (thực thi tasks)
    ↓
Orchestrator (điều phối)
    ↓
Results
```

## Cài đặt

```bash
cd backend
pip install -r requirements.txt
```

## Cấu hình

Tạo file `.env`:

```env
CEREBRAS_API_KEY=your_api_key_here
API_HOST=0.0.0.0
API_PORT=8000
UPLOAD_TOKEN=your_secure_token_here
```

## Chạy server

```bash
python api_server.py
```

Server sẽ chạy tại: `http://localhost:8000`

## API Endpoints

### 1. Health Check
```
GET /api/health
```

### 2. Upload Test Results
```
POST /api/upload
Headers:
    Authorization: Bearer <token>
Form Data:
    file: <test_results_file>
    branch: <git_branch>
    commit: <git_commit>
    author: <author>
    project: <project_name>
```

### 3. Analyze với AI
```
POST /api/analyze
Body:
{
    "request": "user request string",
    "context": {...}
}
```

### 4. Get Dashboard Data
```
POST /api/dashboard
Body:
{
    "test_runs": [...],
    "filters": {...}
}
```

### 5. Analyze Errors
```
POST /api/analyze-errors
Body:
{
    "test_run": {...}
}
```

## Sử dụng với GitHub Actions

Thêm vào `.github/workflows/test.yml`:

```yaml
- name: Upload test results
  run: |
    curl -X POST "http://your-api-domain/api/upload" \
      -H "Authorization: Bearer ${{ secrets.TESTFLOW_TOKEN }}" \
      -F "file=@test-results.xml" \
      -F "branch=${{ github.ref_name }}" \
      -F "commit=${{ github.sha }}" \
      -F "author=${{ github.actor }}" \
      -F "project=your-project"
```

## Test

```bash
# Test upload
curl -X POST "http://localhost:8000/api/upload" \
  -H "Authorization: Bearer your_token" \
  -F "file=@test-results.xml" \
  -F "branch=main" \
  -F "commit=abc123" \
  -F "author=test@example.com"
```

