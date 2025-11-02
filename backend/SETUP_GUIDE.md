# Hướng dẫn Chạy TestFlow AI Backend

## Bước 1: Cài đặt Dependencies

### Yêu cầu hệ thống
- Python 3.8 trở lên
- pip (Python package manager)

### Cài đặt

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt các packages cần thiết
pip install -r requirements.txt
```

**Lưu ý**: Nếu dùng Python 3, có thể cần dùng `pip3`:

```bash
pip3 install -r requirements.txt
```

Hoặc nếu dùng virtual environment (khuyến nghị):

```bash
# Tạo virtual environment
python -m venv venv

# Kích hoạt (Windows)
venv\Scripts\activate

# Kích hoạt (Linux/Mac)
source venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt
```

## Bước 2: Cấu hình API Key

### Tạo file .env

```bash
cd backend
```

Tạo file `.env` với nội dung:

```env
CEREBRAS_API_KEY=csk-ve6r9ehpy8knvt8yy6xmkr98jx4x6pt6f4xdftn3dedfmh6x
```

**Hoặc dùng script tự động** (sẽ được tạo nếu chưa có khi chạy `run.py`)

## Bước 3: Chạy Server

### Cách 1: Dùng script run.py (Khuyến nghị)

```bash
python run.py
```

Script này sẽ:
- ✅ Kiểm tra file .env
- ✅ Hiển thị thông tin server
- ✅ Tự động khởi động server

### Cách 2: Chạy trực tiếp

```bash
python api_server.py
```

### Cách 3: Dùng uvicorn trực tiếp

```bash
uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
```

## Bước 4: Kiểm tra Server

Sau khi server khởi động, bạn sẽ thấy:

```
🚀 Starting TestFlow AI API Server
==================================================
📡 Host: 0.0.0.0
🔌 Port: 8000
🤖 Model: qwen-3-coder-480b
🔑 API Key: csk-ve6r9eh...
==================================================
✅ Server đang khởi động...
🌐 Truy cập: http://localhost:8000
📚 API Docs: http://localhost:8000/docs
```

### Test API

Mở browser và truy cập:

- **Health Check**: http://localhost:8000/api/health
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Root**: http://localhost:8000

## Bước 5: Test Agents (Optional)

Chạy script test:

```bash
python test_agents.py
```

Script này sẽ test:
- ✅ Testing Agent (parse JUnit XML)
- ✅ Execution Agent (tạo test run)
- ✅ AI Analysis Agent (phân tích lỗi)
- ✅ Orchestrator (full workflow)

## Troubleshooting

### Lỗi: "Module not found"

**Nguyên nhân**: Chưa cài đặt dependencies

**Giải pháp**:
```bash
pip install -r requirements.txt
```

### Lỗi: "Cerebras client chưa được khởi tạo"

**Nguyên nhân**: API key chưa được set hoặc không hợp lệ

**Giải pháp**:
1. Kiểm tra file `.env` có tồn tại trong `backend/`
2. Kiểm tra API key trong `.env` có đúng format không
3. Thử set environment variable trực tiếp:

```bash
# Windows PowerShell
$env:CEREBRAS_API_KEY="csk-ve6r9ehpy8knvt8yy6xmkr98jx4x6pt6f4xdftn3dedfmh6x"

# Linux/Mac
export CEREBRAS_API_KEY="csk-ve6r9ehpy8knvt8yy6xmkr98jx4x6pt6f4xdftn3dedfmh6x"
```

### Lỗi: "Port 8000 already in use"

**Nguyên nhân**: Port 8000 đã được sử dụng bởi process khác

**Giải pháp**:
1. Thay đổi port trong file `.env`:
   ```env
   API_PORT=8001
   ```

2. Hoặc tìm và kill process đang dùng port 8000:
   ```bash
   # Windows
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:8000 | xargs kill
   ```

### Lỗi: "python-dotenv not found"

**Nguyên nhân**: Thiếu package python-dotenv

**Giải pháp**:
```bash
pip install python-dotenv
```

## Các lệnh hữu ích

### Kiểm tra Python version
```bash
python --version
```

### Kiểm tra packages đã cài
```bash
pip list | grep -i "fastapi\|cerebras\|dotenv"
```

### Chạy test nhanh
```bash
python test_agents.py
```

### Xem logs chi tiết
Khi chạy server với `--reload`, logs sẽ hiển thị mỗi request.

## Next Steps

Sau khi server chạy thành công:

1. **Tích hợp với Frontend**: 
   - Cập nhật API URL trong frontend code
   - Tham khảo `QUICKSTART.md` để biết cách gọi API

2. **Tích hợp với GitHub Actions**:
   - Thêm workflow để upload test results
   - Tham khảo `README.md` phần CI/CD Integration

3. **Test API endpoints**:
   - Dùng Postman hoặc curl để test
   - Truy cập http://localhost:8000/docs để test trực tiếp

## Support

Nếu gặp vấn đề:
1. Kiểm tra logs trong terminal
2. Đọc file `ENV_SETUP.md` để cấu hình đúng
3. Kiểm tra API key có hợp lệ không
4. Đảm bảo Python version >= 3.8

