#!/bin/bash
# Test Script cho TestFlow AI API
# Sử dụng: bash test_api.sh

API_URL="http://localhost:8000"
UPLOAD_TOKEN="test_token_123"  # Thay bằng token của bạn nếu có

echo "=========================================="
echo "🧪 TestFlow AI API - Test Script"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
curl -s -X GET "${API_URL}/api/health" | python -m json.tool
echo ""
echo "----------------------------------------"
echo ""

# Test 2: Root endpoint
echo "2️⃣  Testing Root Endpoint..."
curl -s -X GET "${API_URL}/" | python -m json.tool
echo ""
echo "----------------------------------------"
echo ""

# Test 3: Analyze với AI
echo "3️⃣  Testing AI Analysis..."
curl -s -X POST "${API_URL}/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "request": "Phân tích đoạn code này và đề xuất test cases: function login(username, password) { if (username === \"admin\" && password === \"123\") { return true; } return false; }",
    "context": {}
  }' | python -m json.tool
echo ""
echo "----------------------------------------"
echo ""

# Test 4: Upload Test Results (JUnit XML)
echo "4️⃣  Testing Upload Test Results..."
# Tạo file test-results.xml tạm thời
cat > /tmp/test-results.xml << 'EOF'
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
EOF

curl -s -X POST "${API_URL}/api/upload" \
  -H "Authorization: Bearer ${UPLOAD_TOKEN}" \
  -F "file=@/tmp/test-results.xml" \
  -F "branch=main" \
  -F "commit=abc123def456" \
  -F "author=test@example.com" \
  -F "project=test-project" | python -m json.tool

echo ""
echo "----------------------------------------"
echo ""

# Test 5: Analyze Errors
echo "5️⃣  Testing Error Analysis..."
curl -s -X POST "${API_URL}/api/analyze-errors" \
  -H "Content-Type: application/json" \
  -d '{
    "test_run": {
      "run_id": "#1001",
      "test_results": [
        {
          "name": "testLoginFailure",
          "status": "fail",
          "error": "Assertion failed: Expected true, got false",
          "stackTrace": "at com.example.AuthTest.testLoginFailure(AuthTest.java:42)\n    at org.junit.jupiter.api.Assertions.assertEquals(Assertions.java:123)",
          "duration": 800
        }
      ]
    }
  }' | python -m json.tool

echo ""
echo "=========================================="
echo "✅ Tests completed!"
echo "=========================================="

