# Hệ thống Đa Agent (Multi-Agent System) - TestFlow AI

## Tổng quan

TestFlow AI sử dụng hệ thống đa agent (multi-agent system) để tự động hóa quy trình xử lý test results và phân tích với AI. Mỗi agent được thiết kế để chuyên sâu vào một lĩnh vực cụ thể, đảm bảo chất lượng phân tích cao và hiệu quả.

## Kiến trúc

```
┌─────────────────────────────────────────┐
│         User Request / CI/CD            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Leader Agent (Orchestrator)        │
│  - Phân tích yêu cầu                    │
│  - Tạo workflow plan                    │
│  - Điều phối các specialist agents      │
└──────────────┬──────────────────────────┘
               │
               ▼
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌─────────┐         ┌─────────┐
│ Testing │         │Execution│
│ Agent   │────────▶│ Agent   │
└─────────┘         └─────────┘
    │                     │
    ▼                     ▼
┌─────────┐         ┌──────────────┐
│Reporting│         │AI Analysis   │
│ Agent   │◀────────│ Agent        │
└─────────┘         └──────────────┘
```

## Các Agents

### 1. Leader Agent (Orchestrator)

**Vai trò**: Project Manager / Tech Lead

**Chức năng**:
- Nhận yêu cầu từ user hoặc CI/CD
- Phân tích yêu cầu và xác định agents cần thiết
- Tạo workflow plan chi tiết
- Điều phối thực thi giữa các specialist agents

**System Prompt**: Được thiết kế như một project manager thông minh, có khả năng:
- Phân tích task phức tạp
- Xác định dependencies giữa các tasks
- Tối ưu workflow
- Xử lý lỗi và fallback

**Output**: JSON workflow plan với:
```json
{
  "agents_needed": ["testing_agent", "execution_agent"],
  "workflow": [
    {"agent": "testing_agent", "task": "...", "input": {...}},
    {"agent": "execution_agent", "task": "...", "input": {...}}
  ],
  "reasoning": "..."
}
```

### 2. Testing Agent

**Vai trò**: Chuyên gia xử lý test results files

**Chức năng**:
- Parse các định dạng: JUnit XML, JSON (Playwright, Jest, Cypress), PyTest, Mocha
- Extract thông tin: test name, status, duration, error messages, stack traces
- Chuẩn hóa dữ liệu về format thống nhất
- Validate và detect format tự động
- Phân loại test cases (unit, integration, e2e)

**Hỗ trợ formats**:
- ✅ JUnit XML
- ✅ Playwright JSON
- ✅ Jest JSON
- ✅ Generic JSON (với LLM parsing)

**Output Format**:
```json
{
  "total": 10,
  "passed": 8,
  "failed": 2,
  "skipped": 0,
  "duration": 2500,
  "tests": [...],
  "metadata": {
    "framework": "Jest",
    "timestamp": "...",
    "source": "jest_json"
  }
}
```

### 3. Execution Agent

**Vai trò**: Quản lý test execution và runs

**Chức năng**:
- Tạo test run records với metadata đầy đủ
- Lưu: branch, commit, author, timestamp, duration
- Track execution status (running, completed, failed)
- So sánh runs để phát hiện regression
- Tính toán metrics: pass rate, fail rate, avg duration

**Metadata Tracking**:
- Git information (branch, commit, commit message)
- Author (name, email)
- CI/CD context (trigger type, CI run URL)
- Environment info
- Framework info

**Features**:
- Run comparison (phát hiện new failures, fixed tests)
- Regression detection
- Pass rate calculation
- Duration analysis

### 4. Reporting Agent

**Vai trò**: Tạo báo cáo và dashboard

**Chức năng**:
- Tạo dashboard với metrics: pass rate, fail count, total tests, duration
- Tạo biểu đồ: Pie chart (Pass/Fail), Bar chart (Trend 7 ngày)
- Generate test details report với filtering
- Generate history report
- Export reports (PDF, CSV, Excel) - planned
- Tạo insights với LLM

**Report Types**:
1. **Dashboard Summary**: Metrics tổng hợp + charts
2. **Test Details**: Chi tiết từng test case với filters
3. **History Report**: Lịch sử test runs với filters

**Filtering Support**:
- By branch
- By author
- By date range
- By status (pass/fail/skip)
- By category (unit/integration/e2e)
- By search term (test name)
- By duration (min/max)

**Insights Generation**:
- Sử dụng LLM để tạo insights tự động
- Phân tích xu hướng
- Khuyến nghị cải thiện

### 5. AI Analysis Agent

**Vai trò**: Phân tích lỗi với AI

**Chức năng**:
- Phân tích error messages và stack traces
- Xác định root cause
- Tóm tắt lỗi ngắn gọn
- Đưa ra gợi ý fix cụ thể
- Đánh giá severity (low/medium/high)
- Phân loại lỗi (assertion, timeout, network, etc.)
- Gom nhóm lỗi tương tự (flaky tests, recurring errors)

**Analysis Output**:
```json
{
  "name": "testLoginFailure",
  "cause": "nguyên nhân ngắn gọn",
  "suggestion": "hướng dẫn fix cụ thể",
  "severity": "medium",
  "category": "assertion"
}
```

**Features**:
- Single error analysis
- Multiple errors analysis (batch)
- Error grouping by pattern
- Flaky test detection
- Error summary generation
- Recommendations

## Workflow Examples

### 1. Upload Test Results từ CI/CD

```
1. User uploads file via API
   ↓
2. Orchestrator.process_test_results_upload()
   ↓
3. Testing Agent: Parse file → Extract test results
   ↓
4. Execution Agent: Create test run → Save metadata
   ↓
5. If failures > 0:
   ↓
6. AI Analysis Agent: Analyze errors → Generate summary
   ↓
7. Reporting Agent: Generate dashboard data
   ↓
8. Return complete result
```

### 2. Analyze Request với AI

```
1. User sends request: "Phân tích lỗi trong test run #1042"
   ↓
2. Leader Agent: Analyze request → Create plan
   ↓
3. Leader determines: Need [execution_agent, ai_analysis_agent]
   ↓
4. Execution Agent: Fetch test run data
   ↓
5. AI Analysis Agent: Analyze errors → Group → Summary
   ↓
6. Return analysis results
```

### 3. Generate Dashboard

```
1. User requests dashboard data
   ↓
2. Reporting Agent: Get test runs
   ↓
3. Apply filters (if any)
   ↓
4. Calculate metrics
   ↓
5. Generate charts data
   ↓
6. Generate insights với LLM
   ↓
7. Return dashboard data
```

## API Integration

### Endpoints

1. **POST /api/upload** - Upload test results
   - Headers: `Authorization: Bearer <token>`
   - Form data: file, branch, commit, author, project
   - Returns: test run info

2. **POST /api/analyze** - Analyze với AI
   - Body: `{"request": "...", "context": {...}}`
   - Returns: analysis results

3. **POST /api/dashboard** - Get dashboard data
   - Body: `{"test_runs": [...], "filters": {...}}`
   - Returns: dashboard data

4. **POST /api/analyze-errors** - Analyze test errors
   - Body: `{"test_run": {...}}`
   - Returns: error analysis

## Cấu hình

### Environment Variables

```env
CEREBRAS_API_KEY=your_api_key
API_HOST=0.0.0.0
API_PORT=8000
UPLOAD_TOKEN=your_secure_token
```

### Model Configuration

- **Model**: `qwen-3-coder-480b`
- **Provider**: Cerebras Cloud
- **SDK**: `cerebras-cloud-sdk`

## Testing

Chạy test script:

```bash
python test_agents.py
```

Script sẽ test:
- Testing Agent với JUnit XML
- Execution Agent với mock data
- AI Analysis Agent với error analysis
- Orchestrator với full workflow

## Mở rộng

### Thêm Agent mới

1. Tạo class mới kế thừa `BaseAgent`
2. Implement `get_system_prompt()` và `process()`
3. Đăng ký trong `Orchestrator.__init__()`
4. Thêm vào `LeaderAgent.available_agents`

### Custom System Prompts

Mỗi agent có system prompt riêng, có thể tùy chỉnh trong:
- `get_system_prompt()` method
- Hoặc load từ file/config

## Best Practices

1. **Agent Specialization**: Mỗi agent chỉ làm một việc tốt
2. **Error Handling**: Mỗi agent phải handle errors gracefully
3. **Context Passing**: Truyền context đầy đủ giữa các agents
4. **LLM Optimization**: Sử dụng LLM hợp lý, tránh lạm dụng
5. **Caching**: Cache kết quả khi có thể (future enhancement)

## Roadmap

- [ ] Database persistence (Supabase)
- [ ] Real-time updates với WebSocket
- [ ] Agent performance monitoring
- [ ] Custom agent workflows
- [ ] Agent learning từ feedback
- [ ] Multi-model support (fallback models)

