# Test Examples - TestFlow AI API

## 📋 Các chức năng đã có thể sử dụng

### ✅ 1. Health Check
### ✅ 2. Upload Test Results (JUnit XML, JSON)
### ✅ 3. Analyze với AI (Phân tích code/test)
### ✅ 4. Analyze Errors (Phân tích lỗi với AI)
### ✅ 5. Dashboard Data (Lấy dữ liệu dashboard)

---

## 🧪 Cách Test

### Chuẩn bị

1. **Đảm bảo server đang chạy:**
```bash
cd backend
python run.py
```

2. **Mở terminal mới** để chạy các lệnh test

---

## 📝 Test Examples

### 1. Health Check ✅

**Endpoint:** `GET /api/health`

**Test:**
```bash
curl http://localhost:8000/api/health
```

**Hoặc dùng browser:**
http://localhost:8000/api/health

**Kết quả mong đợi:**
```json
{"status":"healthy"}
```

---

### 2. Upload Test Results ✅

**Endpoint:** `POST /api/upload`

#### Example 1: Upload JUnit XML

**Tạo file `test-results.xml`:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="com.example.TestSuite" tests="5" failures="2" errors="0" skipped="1" time="3.5">
    <testcase name="testLoginSuccess" classname="com.example.AuthTest" time="1.2">
    </testcase>
    <testcase name="testLoginFailure" classname="com.example.AuthTest" time="0.8">
        <failure message="Expected true, got false" type="AssertionError">
            at com.example.AuthTest.testLoginFailure(AuthTest.java:42)
            at org.junit.jupiter.api.Assertions.assertEquals(Assertions.java:123)
        </failure>
    </testcase>
    <testcase name="testRegistration" classname="com.example.UserTest" time="0.5">
    </testcase>
    <testcase name="testPasswordValidation" classname="com.example.UserTest" time="0.9">
        <failure message="Password too short" type="ValidationException">
            at com.example.UserTest.testPasswordValidation(UserTest.java:67)
        </failure>
    </testcase>
    <testcase name="testEmailFormat" classname="com.example.UserTest" time="0.1">
        <skipped/>
    </testcase>
</testsuite>
```

**Upload với curl:**
```bash
curl -X POST "http://localhost:8000/api/upload" \
  -H "Authorization: Bearer test_token_123" \
  -F "file=@test-results.xml" \
  -F "branch=main" \
  -F "commit=abc123def456" \
  -F "author=dev@example.com" \
  -F "project=my-awesome-project"
```

**Hoặc với PowerShell:**
```powershell
$headers = @{ "Authorization" = "Bearer test_token_123" }
$form = @{
    file = Get-Item "test-results.xml"
    branch = "main"
    commit = "abc123def456"
    author = "dev@example.com"
    project = "my-awesome-project"
}
Invoke-RestMethod -Uri "http://localhost:8000/api/upload" -Method Post -Headers $headers -Form $form
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Test results uploaded successfully",
  "data": {
    "run_id": "#1042",
    "total_tests": 5,
    "passed": 2,
    "failed": 2
  }
}
```

#### Example 2: Upload Playwright JSON

**Tạo file `playwright-results.json`:**
```json
{
  "stats": {
    "total": 4,
    "expected": 3,
    "unexpected": 1,
    "skipped": 0,
    "duration": 2500
  },
  "suites": [
    {
      "specs": [
        {
          "tests": [
            {
              "title": "should login successfully",
              "results": [
                {
                  "status": "passed",
                  "duration": 1200
                }
              ]
            },
            {
              "title": "should fail with wrong password",
              "results": [
                {
                  "status": "failed",
                  "duration": 800,
                  "error": {
                    "message": "Expected to find button 'Login' but found 'Sign In'"
                  }
                }
              ]
            },
            {
              "title": "should register new user",
              "results": [
                {
                  "status": "passed",
                  "duration": 500
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Upload:**
```bash
curl -X POST "http://localhost:8000/api/upload" \
  -H "Authorization: Bearer test_token_123" \
  -F "file=@playwright-results.json" \
  -F "branch=feature/auth" \
  -F "commit=def789" \
  -F "author=qa@example.com" \
  -F "project=e2e-tests"
```

---

### 3. Analyze với AI ✅

**Endpoint:** `POST /api/analyze`

#### Example 1: Phân tích code và đề xuất test cases

```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "request": "Phân tích function login này và đề xuất test cases: function login(username, password) { if (username === \"admin\" && password === \"123\") { return { success: true, token: \"abc123\" }; } return { success: false, error: \"Invalid credentials\" }; }",
    "context": {
      "language": "javascript",
      "framework": "jest"
    }
  }'
```

**PowerShell:**
```powershell
$body = @{
    request = "Phân tích function login này và đề xuất test cases: function login(username, password) { if (username === 'admin' && password === '123') { return { success: true, token: 'abc123' }; } return { success: false, error: 'Invalid credentials' }; }"
    context = @{
        language = "javascript"
        framework = "jest"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/analyze" -Method Post -Body $body -ContentType "application/json"
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "original_request": "...",
  "plan": {
    "agents_needed": ["testing_agent", "ai_analysis_agent"],
    "workflow": [...]
  },
  "workflow_results": [...],
  "final_output": {...}
}
```

#### Example 2: Phân tích Python code

```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "request": "Phân tích và đề xuất test cases cho function này: def divide(a, b): return a / b",
    "context": {
      "language": "python",
      "framework": "pytest"
    }
  }'
```

---

### 4. Analyze Errors ✅

**Endpoint:** `POST /api/analyze-errors`

```bash
curl -X POST "http://localhost:8000/api/analyze-errors" \
  -H "Content-Type: application/json" \
  -d '{
    "test_run": {
      "run_id": "#1042",
      "test_results": [
        {
          "name": "testLoginFailure",
          "status": "fail",
          "error": "AssertionError: Expected true, got false",
          "stackTrace": "at com.example.AuthTest.testLoginFailure(AuthTest.java:42)\n    at org.junit.jupiter.api.Assertions.assertEquals(Assertions.java:123)\n    at com.example.AuthTest.testLoginFailure(AuthTest.java:42)",
          "duration": 800,
          "category": "unit"
        },
        {
          "name": "testPasswordValidation",
          "status": "fail",
          "error": "ValidationException: Password too short",
          "stackTrace": "at com.example.UserTest.testPasswordValidation(UserTest.java:67)",
          "duration": 900,
          "category": "unit"
        }
      ]
    }
  }'
```

**PowerShell:**
```powershell
$body = @{
    test_run = @{
        run_id = "#1042"
        test_results = @(
            @{
                name = "testLoginFailure"
                status = "fail"
                error = "AssertionError: Expected true, got false"
                stackTrace = "at com.example.AuthTest.testLoginFailure(AuthTest.java:42)"
                duration = 800
                category = "unit"
            }
        )
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:8000/api/analyze-errors" -Method Post -Body $body -ContentType "application/json"
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "analyses": [
    {
      "name": "testLoginFailure",
      "cause": "Assertion failed - giá trị thực tế không khớp với giá trị mong đợi",
      "suggestion": "1. Kiểm tra logic login function\n2. Verify input values\n3. Check authentication flow",
      "severity": "high",
      "category": "assertion"
    }
  ],
  "groups": {
    "by_category": {...},
    "flaky_tests": {...}
  },
  "summary": {
    "total_errors": 2,
    "summary_text": "...",
    "recommendations": [...]
  }
}
```

---

### 5. Dashboard Data ✅

**Endpoint:** `POST /api/dashboard`

**Lưu ý:** Endpoint này cần có test runs data. Sau khi upload test results, bạn có thể gọi endpoint này.

```bash
curl -X POST "http://localhost:8000/api/dashboard" \
  -H "Content-Type: application/json" \
  -d '{
    "test_runs": [
      {
        "run_id": "#1042",
        "total_tests": 5,
        "passed": 3,
        "failed": 2,
        "skipped": 0,
        "duration_ms": 3500,
        "timestamp": "2025-01-15T10:30:00"
      }
    ],
    "filters": {
      "branch": "main"
    }
  }'
```

**Kết quả mong đợi:**
```json
{
  "metrics": {
    "latest_pass_rate": 60.0,
    "latest_failed_tests": 2,
    "overall_pass_rate": 60.0
  },
  "charts_data": {
    "pie_chart": [...],
    "bar_chart": [...]
  },
  "insights": [...]
}
```

---

## 🚀 Chạy Test Scripts tự động

### Linux/Mac

```bash
chmod +x test_api.sh
./test_api.sh
```

### Windows PowerShell

```powershell
.\test_api.ps1
```

---

## 📊 Swagger UI (Interactive Testing)

Mở browser và truy cập:

**http://localhost:8000/docs**

Tại đây bạn có thể:
- ✅ Xem tất cả endpoints
- ✅ Test trực tiếp từ browser
- ✅ Xem request/response examples
- ✅ Xem schema definitions

---

## 🔍 Tips

1. **Kiểm tra logs:** Khi chạy server, logs sẽ hiển thị mỗi request
2. **CORS:** Nếu test từ browser khác domain, đảm bảo CORS được config đúng
3. **Token:** Nếu set `UPLOAD_TOKEN` trong `.env`, phải dùng token đó khi upload
4. **File size:** Max file size là 10MB (configurable trong `config.py`)

---

## 🐛 Troubleshooting

### Lỗi 401/403 khi upload
- Kiểm tra `UPLOAD_TOKEN` trong `.env`
- Hoặc set header `Authorization: Bearer <your_token>`

### Lỗi "Cerebras client chưa được khởi tạo"
- Kiểm tra `CEREBRAS_API_KEY` trong `.env`
- Đảm bảo API key hợp lệ

### Lỗi CORS
- Kiểm tra frontend URL có trong `CORS_ORIGINS` trong `config.py`

