# Test Code Analysis Endpoints - 3 Chức Năng Chính

## 📋 Tổng quan

Ba endpoint mới để phân tích code:

1. **POST /api/analyze-github** - Đọc code từ GitHub URL
2. **POST /api/analyze-code** - Phân tích code snippet người dùng nhập
3. **POST /api/analyze-files** - Đọc file code từ máy người dùng

---

## 🧪 Test Examples

### 1. Analyze GitHub URL ✅

**Endpoint:** `POST /api/analyze-github`

#### Example 1: Public Repository

```bash
curl -X POST "http://localhost:8000/api/analyze-github" \
  -H "Content-Type: application/json" \
  -d '{
    "github_url": "https://github.com/facebook/react",
    "branch": "main",
    "max_files": 10
  }'
```

**PowerShell:**
```powershell
$body = @{
    github_url = "https://github.com/facebook/react"
    branch = "main"
    max_files = 10
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/analyze-github" -Method Post -Body $body -ContentType "application/json"
```

#### Example 2: Specific File

```bash
curl -X POST "http://localhost:8000/api/analyze-github" \
  -H "Content-Type: application/json" \
  -d '{
    "github_url": "https://github.com/microsoft/vscode/blob/main/src/main.ts",
    "max_files": 5
  }'
```

#### Example 3: Specific Path/Folder

```bash
curl -X POST "http://localhost:8000/api/analyze-github" \
  -H "Content-Type: application/json" \
  -d '{
    "github_url": "https://github.com/owner/repo/tree/main/src",
    "path": "src",
    "max_files": 20
  }'
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "github_data": {
    "url": "https://github.com/...",
    "owner": "...",
    "repo": "...",
    "branch": "main",
    "files": [...],
    "total_files": 10
  },
  "analysis": {
    "success": true,
    "plan": {...},
    "workflow_results": [...]
  },
  "summary": {
    "total_files": 10,
    "detected_languages": ["javascript", "typescript"],
    "repo_info": {...}
  }
}
```

**Lưu ý:**
- GitHub API rate limit: 60 requests/hour (không có token), 5000 requests/hour (có token)
- Nếu repo là private, cần GitHub token (set `GITHUB_TOKEN` trong `.env`)
- Max files mặc định: 20, có thể tùy chỉnh

---

### 2. Analyze Code Snippet ✅

**Endpoint:** `POST /api/analyze-code`

#### Example 1: JavaScript Function

```bash
curl -X POST "http://localhost:8000/api/analyze-code" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function login(username, password) {\n  if (username === \"admin\" && password === \"123\") {\n    return { success: true, token: \"abc123\" };\n  }\n  return { success: false, error: \"Invalid credentials\" };\n}",
    "language": "javascript"
  }'
```

**PowerShell:**
```powershell
$code = @"
function login(username, password) {
  if (username === "admin" && password === "123") {
    return { success: true, token: "abc123" };
  }
  return { success: false, error: "Invalid credentials" };
}
"@

$body = @{
    code = $code
    language = "javascript"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/analyze-code" -Method Post -Body $body -ContentType "application/json"
```

#### Example 2: Python Function

```bash
curl -X POST "http://localhost:8000/api/analyze-code" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def divide(a, b):\n    if b == 0:\n        raise ValueError(\"Cannot divide by zero\")\n    return a / b\n\ndef calculate_average(numbers):\n    if not numbers:\n        return 0\n    return sum(numbers) / len(numbers)",
    "language": "python"
  }'
```

#### Example 3: TypeScript Class

```bash
curl -X POST "http://localhost:8000/api/analyze-code" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "class UserService {\n  private users: User[] = [];\n\n  async createUser(data: CreateUserDto): Promise<User> {\n    const user = new User(data);\n    this.users.push(user);\n    return user;\n  }\n\n  async getUserById(id: string): Promise<User | null> {\n    return this.users.find(u => u.id === id) || null;\n  }\n}",
    "language": "typescript",
    "context": {
      "framework": "nestjs",
      "description": "User service for managing users"
    }
  }'
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "code_info": {
    "language": "javascript",
    "length": 156,
    "lines": 6
  },
  "analysis": {
    "success": true,
    "original_request": "...",
    "plan": {
      "agents_needed": ["ai_analysis_agent"],
      "workflow": [...]
    },
    "workflow_results": [...],
    "final_output": {...}
  }
}
```

---

### 3. Analyze Uploaded Files ✅

**Endpoint:** `POST /api/analyze-files`

#### Example 1: Upload Single File

**Tạo file `test.js`:**
```javascript
function calculateTax(amount, rate) {
  if (amount < 0) {
    throw new Error("Amount cannot be negative");
  }
  if (rate < 0 || rate > 1) {
    throw new Error("Rate must be between 0 and 1");
  }
  return amount * rate;
}

module.exports = { calculateTax };
```

**Upload với curl:**
```bash
curl -X POST "http://localhost:8000/api/analyze-files" \
  -F "files=@test.js" \
  -F "language=javascript"
```

**PowerShell:**
```powershell
$file = Get-Item "test.js"
$form = @{
    files = $file
    language = "javascript"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/analyze-files" -Method Post -Form $form
```

#### Example 2: Upload Multiple Files

**Tạo các file:**
- `auth.js` - Authentication functions
- `user.js` - User management
- `utils.js` - Utility functions

**Upload:**
```bash
curl -X POST "http://localhost:8000/api/analyze-files" \
  -F "files=@auth.js" \
  -F "files=@user.js" \
  -F "files=@utils.js"
```

**PowerShell:**
```powershell
$files = @(
    (Get-Item "auth.js"),
    (Get-Item "user.js"),
    (Get-Item "utils.js")
)

$form = @{
    files = $files
}

Invoke-RestMethod -Uri "http://localhost:8000/api/analyze-files" -Method Post -Form $form
```

#### Example 3: Python Files

**Tạo file `calculator.py`:**
```python
class Calculator:
    def add(self, a, b):
        return a + b
    
    def subtract(self, a, b):
        return a - b
    
    def multiply(self, a, b):
        if a == 0 or b == 0:
            return 0
        return a * b
    
    def divide(self, a, b):
        if b == 0:
            raise ValueError("Division by zero")
        return a / b
```

**Upload:**
```bash
curl -X POST "http://localhost:8000/api/analyze-files" \
  -F "files=@calculator.py" \
  -F "language=python"
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "files_info": [
    {
      "name": "test.js",
      "size": 256,
      "language": "javascript",
      "lines": 12
    }
  ],
  "detected_languages": ["javascript"],
  "analysis": {
    "success": true,
    "plan": {...},
    "workflow_results": [...]
  }
}
```

---

## 🔧 Configuration

### GitHub Token (Optional)

Để truy cập private repos hoặc tăng rate limit, thêm vào `.env`:

```env
GITHUB_TOKEN=your_github_personal_access_token
```

Lấy token tại: https://github.com/settings/tokens

### File Size Limit

Mặc định: 10MB per file (configurable trong `config.py`)

---

## 📊 Response Format

Tất cả 3 endpoints đều trả về:

```json
{
  "success": true,
  "analysis": {
    "success": true,
    "original_request": "...",
    "plan": {
      "agents_needed": [...],
      "workflow": [...],
      "reasoning": "..."
    },
    "workflow_results": [
      {
        "step": "leader_agent",
        "result": {...}
      },
      {
        "step": "ai_analysis_agent",
        "result": {...}
      }
    ],
    "final_output": {
      "analyses": [...],
      "summary": {...}
    }
  }
}
```

---

## 🐛 Troubleshooting

### GitHub API Errors

**403 Forbidden:**
- Rate limit exceeded → Thêm GitHub token
- Repository is private → Cần token với quyền truy cập

**404 Not Found:**
- URL không đúng format
- Repository không tồn tại hoặc không public

### File Upload Errors

**413 Payload Too Large:**
- File vượt quá 10MB
- Giải pháp: Giảm kích thước file hoặc tăng `MAX_FILE_SIZE` trong config

**400 Bad Request:**
- File encoding không phải UTF-8
- Giải pháp: Convert file sang UTF-8

### Code Analysis Errors

**500 Internal Server Error:**
- API key Cerebras chưa được set
- Kiểm tra `CEREBRAS_API_KEY` trong `.env`

---

## 💡 Tips

1. **GitHub URL**: 
   - Có thể phân tích toàn bộ repo hoặc specific file/folder
   - Tự động detect branch (default: main)

2. **Code Snippet**:
   - Có thể analyze bất kỳ đoạn code nào
   - Tự động detect language nếu không specify

3. **File Upload**:
   - Hỗ trợ multiple files
   - Tự động detect language từ file extension
   - Combine tất cả files để analyze cùng lúc

---

## 🚀 Quick Test Commands

### Test All 3 Endpoints:

```bash
# 1. GitHub URL
curl -X POST "http://localhost:8000/api/analyze-github" \
  -H "Content-Type: application/json" \
  -d '{"github_url": "https://github.com/microsoft/vscode", "max_files": 5}'

# 2. Code Snippet
curl -X POST "http://localhost:8000/api/analyze-code" \
  -H "Content-Type: application/json" \
  -d '{"code": "function test() { return true; }", "language": "javascript"}'

# 3. File Upload
curl -X POST "http://localhost:8000/api/analyze-files" \
  -F "files=@your-file.js"
```

