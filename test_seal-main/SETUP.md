# 🚀 TestStudio - Hướng dẫn Setup và Chạy dự án

## 📋 Mục lục
1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Cài đặt Backend](#cài-đặt-backend)
3. [Cài đặt Frontend](#cài-đặt-frontend)
4. [Cấu hình Environment Variables](#cấu-hình-environment-variables)
5. [Chạy dự án](#chạy-dự-án)
6. [Kiểm tra hoạt động](#kiểm-tra-hoạt-động)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Yêu cầu hệ thống

- **Node.js**: Version 18.x trở lên
- **npm**: Version 9.x trở lên (hoặc yarn/pnpm)
- **Gemini API Key**: Cần có API key từ Google AI Studio
- **Git**: (Optional) để clone repository

### Kiểm tra Node.js
```bash
node --version
# Nên hiển thị: v18.x.x hoặc cao hơn

npm --version
# Nên hiển thị: 9.x.x hoặc cao hơn
```

---

## 📦 Cài đặt Backend

### Bước 1: Vào thư mục server
```bash
cd server
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

Lệnh này sẽ cài đặt các packages cần thiết:
- Express.js
- Google Generative AI SDK
- Better SQLite3
- Multer (file upload)
- TypeScript và các type definitions

### Bước 3: Tạo file .env

Tạo file `.env` trong thư mục `server/` với nội dung:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Gemini AI Configuration (QUAN TRỌNG!)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# Database Configuration
DB_PATH=./data/teststudio.db

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

**⚠️ LƯU Ý QUAN TRỌNG**: 
- Thay `your_gemini_api_key_here` bằng API key thật của bạn
- Lấy API key tại: https://aistudio.google.com/apikey

### Bước 4: Tạo các thư mục cần thiết

Các thư mục này sẽ được tạo tự động khi chạy server lần đầu, nhưng bạn có thể tạo trước:

```bash
mkdir -p data
mkdir -p uploads
```

---

## 🎨 Cài đặt Frontend

### Bước 1: Quay lại thư mục gốc
```bash
cd ..
# (Nếu bạn đang ở thư mục server)
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

Lệnh này sẽ cài đặt:
- React 19
- React Router DOM
- Recharts (charts)
- TypeScript
- Vite (build tool)

### Bước 3: Cấu hình API URL (Optional)

Nếu backend chạy ở port khác hoặc URL khác, tạo file `.env.local` trong thư mục gốc:

```env
VITE_API_URL=http://localhost:3001/api
```

Mặc định frontend sẽ tự động sử dụng `http://localhost:3001/api`

---

## ⚙️ Cấu hình Environment Variables

### Backend (.env trong thư mục server/)

| Biến | Mô tả | Ví dụ |
|------|-------|-------|
| `PORT` | Port cho backend server | `3001` |
| `GEMINI_API_KEY`` | **BẮT BUỘC** - API key từ Google AI Studio | `AIzaSy...` |
| `GEMINI_MODEL` | Model Gemini sử dụng | `gemini-2.0-flash-exp` |
| `DB_PATH` | Đường dẫn database file | `./data/teststudio.db` |
| `CORS_ORIGIN` | URL frontend (để CORS) | `http://localhost:3000` |

### Frontend (.env.local - Optional)

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `VITE_API_URL` | URL backend API | `http://localhost:3001/api` |

---

## 🚀 Chạy dự án

### Cách 1: Chạy riêng biệt (Khuyên dùng cho development)

#### Terminal 1 - Backend
```bash
cd server
npm run dev
```

Bạn sẽ thấy:
```
[Server] ✅ TestStudio Backend Server running on port 3001
[Server] Environment: development
[Server] Gemini Model: gemini-2.0-flash-exp
[Server] Database: ./data/teststudio.db
[Server] API: http://localhost:3001/api
[Server] Health Check: http://localhost:3001/api/health
```

#### Terminal 2 - Frontend
```bash
# Từ thư mục gốc (test_seal-main)
npm run dev
```

Bạn sẽ thấy:
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Cách 2: Sử dụng npm scripts (Nếu có setup)

Có thể tạo script trong `package.json` gốc để chạy cả hai cùng lúc, nhưng khuyên dùng cách 1 để dễ debug.

---

## ✅ Kiểm tra hoạt động

### 1. Kiểm tra Backend

Mở browser hoặc dùng curl:

```bash
# Health check
curl http://localhost:3001/api/health

# Kết quả mong đợi:
# {"status":"ok","timestamp":"2025-01-XX..."}
```

Hoặc mở browser: http://localhost:3001/api/health

### 2. Kiểm tra Frontend

Mở browser: http://localhost:3000

Bạn sẽ thấy:
- Trang login/auth (TestStudio)
- Click "Continue with Email" để vào
- Trang Home với 3 tabs: GitHub URL, Code Snippet, Upload Files

### 3. Test Flow cơ bản

1. **Upload file code**:
   - Chọn tab "Upload Files"
   - Chọn một file code (`.js`, `.ts`, `.py`, v.v.)
   - Click "Analyze Files"
   - Đợi AI phân tích (có progress bar)

2. **Xem kết quả**:
   - Sau khi phân tích xong, tự động chuyển đến trang Analyze
   - Xem AI Summary và Suggested Test Cases
   - Tick chọn các test cases muốn chạy

3. **Chạy tests**:
   - Click "Run X Selected Tests"
   - Chuyển đến trang Execution
   - Xem progress real-time

4. **Xem kết quả**:
   - Xem dashboard tại `/dashboard`
   - Xem history tại `/history`

---

## 🐛 Troubleshooting

### Lỗi: "GEMINI_API_KEY is not set"

**Nguyên nhân**: Chưa set API key trong file `.env`

**Giải pháp**:
1. Kiểm tra file `server/.env` có tồn tại không
2. Đảm bảo có dòng: `GEMINI_API_KEY=your_actual_key_here`
3. Restart backend server

### Lỗi: "Port 3001 already in use"

**Nguyên nhân**: Port 3001 đang được sử dụng bởi process khác

**Giải pháp**:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Hoặc đổi PORT trong server/.env
PORT=3002
```

### Lỗi: "Cannot find module '../services/api.service'"

**Nguyên nhân**: File api.service.ts không ở đúng vị trí

**Giải pháp**:
1. Kiểm tra file `services/api.service.ts` có tồn tại
2. Nếu không có, kiểm tra `src/services/api.service.ts`
3. Hoặc tạo lại từ code trong PROJECT_SUMMARY.md

### Lỗi: CORS error khi gọi API

**Nguyên nhân**: CORS_ORIGIN không khớp với frontend URL

**Giải pháp**:
1. Kiểm tra frontend đang chạy ở URL nào (thường là http://localhost:3000)
2. Update `CORS_ORIGIN` trong `server/.env` cho đúng
3. Restart backend

### Lỗi: Database locked

**Nguyên nhân**: Database đang được sử dụng bởi process khác

**Giải pháp**:
```bash
# Tắt tất cả backend processes
# Hoặc xóa và tạo lại database
rm server/data/teststudio.db
# Restart server (sẽ tự tạo lại)
```

### Frontend không kết nối được Backend

**Kiểm tra**:
1. Backend có đang chạy không? Check http://localhost:3001/api/health
2. API URL đúng chưa? Check `.env.local` hoặc default `http://localhost:3001/api`
3. CORS đúng chưa? Check `CORS_ORIGIN` trong backend `.env`

### AI Analysis không hoạt động

**Kiểm tra**:
1. Gemini API key có hợp lệ không?
2. Có đủ quota/credit không?
3. Check console logs của backend để xem error chi tiết
4. Thử với file code nhỏ hơn (dưới 10MB)

---

## 📝 Notes

### Database
- Database được tạo tự động lần đầu chạy
- File database: `server/data/teststudio.db`
- Có thể xóa file này để reset database

### Upload Files
- Files được upload vào: `server/uploads/`
- Max file size: 10MB (có thể config trong `.env`)
- Supported formats: `.js`, `.ts`, `.py`, `.java`, `.cs`, v.v.

### Development vs Production
- Hiện tại setup cho **development**
- Để deploy production:
  - Build frontend: `npm run build`
  - Build backend: `cd server && npm run build`
  - Sử dụng PM2 hoặc process manager
  - Đổi database sang PostgreSQL thay vì SQLite

---

## 🎯 Next Steps sau khi setup

1. ✅ Test với một file code đơn giản
2. ✅ Xem AI-generated test cases
3. ✅ Chạy test execution
4. ✅ Xem dashboard và history
5. 🚀 Bắt đầu sử dụng cho dự án của bạn!

---

## 📞 Support

Nếu gặp vấn đề:
1. Check lại các bước setup
2. Xem logs trong terminal
3. Kiểm tra `.env` files
4. Đọc `PROJECT_SUMMARY.md` để hiểu cấu trúc

---

**Chúc bạn code vui vẻ! 🎉**

