# Quick Start Guide - TestFlow AI Backend

## Cài đặt nhanh

### 1. Cài đặt dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Cấu hình

Copy file `.env.example` thành `.env` và điền thông tin:

```bash
cp .env.example .env
```

Chỉnh sửa `.env`:
```env
CEREBRAS_API_KEY=your_api_key_here
UPLOAD_TOKEN=your_secure_token_here
```

### 3. Chạy server

```bash
python api_server.py
```

Server sẽ chạy tại: `http://localhost:8000`

## Test nhanh

### 1. Test các agents

```bash
python test_agents.py
```

### 2. Test API với curl

#### Upload test results

```bash
curl -X POST "http://localhost:8000/api/upload" \
  -H "Authorization: Bearer your_token" \
  -F "file=@test-results.xml" \
  -F "branch=main" \
  -F "commit=abc123" \
  -F "author=test@example.com" \
  -F "project=test-project"
```

#### Analyze với AI

```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "request": "Phân tích lỗi trong test run gần nhất",
    "context": {}
  }'
```

## Tích hợp với Frontend

### 1. Cập nhật API URL trong frontend

Trong file frontend config, thêm:

```typescript
const API_BASE_URL = 'http://localhost:8000';
```

### 2. Gọi API từ React

```typescript
// Upload test results
const uploadTestResults = async (file: File, metadata: any) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('branch', metadata.branch);
  formData.append('commit', metadata.commit);
  formData.append('author', metadata.author);
  
  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UPLOAD_TOKEN}`
    },
    body: formData
  });
  
  return response.json();
};
```

## Tích hợp với GitHub Actions

Thêm vào `.github/workflows/test.yml`:

```yaml
- name: Upload test results
  run: |
    curl -X POST "${{ secrets.TESTFLOW_API_URL }}/api/upload" \
      -H "Authorization: Bearer ${{ secrets.TESTFLOW_TOKEN }}" \
      -F "file=@test-results.xml" \
      -F "branch=${{ github.ref_name }}" \
      -F "commit=${{ github.sha }}" \
      -F "author=${{ github.actor }}" \
      -F "project=${{ github.repository }}"
```

## Troubleshooting

### Lỗi: "Cerebras client chưa được khởi tạo"

- Kiểm tra `CEREBRAS_API_KEY` trong `.env`
- Đảm bảo API key hợp lệ

### Lỗi: CORS

- Kiểm tra `CORS_ORIGINS` trong `config.py`
- Thêm origin của frontend vào list

### Lỗi: Import module

- Đảm bảo đã cài đặt tất cả dependencies: `pip install -r requirements.txt`
- Kiểm tra Python version (yêu cầu >= 3.8)

## Next Steps

1. Đọc [AGENT_SYSTEM.md](./AGENT_SYSTEM.md) để hiểu về kiến trúc agents
2. Đọc [README.md](./README.md) để biết chi tiết về API
3. Customize system prompts cho các agents nếu cần
4. Tích hợp với database (Supabase) để persist data

