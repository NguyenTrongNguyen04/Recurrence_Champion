# Test Script cho TestFlow AI API (PowerShell)
# Sử dụng: .\test_api.ps1

$API_URL = "http://localhost:8000"
$UPLOAD_TOKEN = "test_token_123"  # Thay bằng token của bạn nếu có

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🧪 TestFlow AI API - Test Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1️⃣  Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/health" -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Test 2: Root endpoint
Write-Host "2️⃣  Testing Root Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/" -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Test 3: Analyze với AI
Write-Host "3️⃣  Testing AI Analysis..." -ForegroundColor Yellow
$analyzeBody = @{
    request = "Phân tích đoạn code này và đề xuất test cases: function login(username, password) { if (username === 'admin' && password === '123') { return true; } return false; }"
    context = @{}
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/analyze" -Method Post -Body $analyzeBody -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Test 4: Upload Test Results
Write-Host "4️⃣  Testing Upload Test Results..." -ForegroundColor Yellow
# Tạo file test-results.xml tạm thời
$xmlContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="com.example.TestSuite" tests="3" failures="1" errors="0" skipped="0" time="2.5">
    <testcase name="testLoginSuccess" classname="com.example.AuthTest" time="1.2">
    </testcase>
    <testcase name="testLoginFailure" classname="com.example.AuthTest" time="0.8">
        <failure message="Expected true, got false" type="AssertionError">
            at com.example.AuthTest.testLoginFailure(AuthTest.java:42)
        </failure>
    </testcase>
    <testcase name="testRegistration" classname="com.example.UserTest" time="0.5">
    </testcase>
</testsuite>
"@

$tempFile = "$env:TEMP\test-results.xml"
$xmlContent | Out-File -FilePath $tempFile -Encoding UTF8

$headers = @{
    "Authorization" = "Bearer $UPLOAD_TOKEN"
}

$formFields = @{
    file = Get-Item $tempFile
    branch = "main"
    commit = "abc123def456"
    author = "test@example.com"
    project = "test-project"
}

try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/upload" -Method Post -Headers $headers -Form $formFields
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Remove-Item $tempFile -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Test 5: Analyze Errors
Write-Host "5️⃣  Testing Error Analysis..." -ForegroundColor Yellow
$errorBody = @{
    test_run = @{
        run_id = "#1001"
        test_results = @(
            @{
                name = "testLoginFailure"
                status = "fail"
                error = "Assertion failed: Expected true, got false"
                stackTrace = "at com.example.AuthTest.testLoginFailure(AuthTest.java:42)`n    at org.junit.jupiter.api.Assertions.assertEquals(Assertions.java:123)"
                duration = 800
            }
        )
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/analyze-errors" -Method Post -Body $errorBody -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Tests completed!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

