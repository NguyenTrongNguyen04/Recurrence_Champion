# TestStudio - Full Stack Implementation Guide

## 📋 Tổng quan

Đây là hướng dẫn để chạy toàn bộ hệ thống TestStudio bao gồm cả Frontend và Backend.

## 🚀 Quick Start

### 1. Setup Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env và thêm GEMINI_API_KEY
npm run dev
```

Backend sẽ chạy tại: `http://localhost:3001`

### 2. Setup Frontend

```bash
# Từ thư mục gốc
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## 🔑 Cấu hình

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
DB_PATH=./data/teststudio.db
CORS_ORIGIN=http://localhost:3000
```

### Frontend
Tạo file `.env.local` (nếu cần):
```env
VITE_API_URL=http://localhost:3001/api
```

## 📁 Cấu trúc dự án

```
test_seal-main/
├── server/                 # Backend server
│   ├── src/
│   │   ├── services/      # Gemini, Database, CodeParser services
│   │   ├── routes/        # API routes
│   │   ├── types/         # TypeScript types
│   │   └── index.ts       # Main server file
│   ├── package.json
│   └── .env
├── src/                    # Frontend
│   ├── services/          # API service
│   ├── components/        # UI components
│   ├── pages/             # Pages
│   └── ...
└── package.json
```

## 🎯 Features đã implement

### ✅ Backend
- [x] Express server với TypeScript
- [x] Gemini AI integration với prompt chuẩn
- [x] File upload và code parsing
- [x] Database (SQLite) với đầy đủ schema
- [x] API endpoints cho analysis, execution, history
- [x] Test execution simulation
- [x] AI-powered failure explanation

### ✅ Frontend
- [x] File upload UI
- [x] Code snippet input
- [x] Real-time analysis progress
- [x] Test cases review và selection
- [x] Test execution với progress tracking
- [x] Results visualization
- [x] History page

## 🔧 Next Steps (Optional)

1. **GitHub Integration**: Implement GitHub URL analysis
2. **Real Test Execution**: Integrate với Jest/PyTest thật
3. **Export Reports**: PDF/HTML export functionality
4. **Edit Test Cases**: UI để chỉnh sửa test cases
5. **CI/CD Integration**: Auto-trigger tests

## 📝 Notes

- Database được tạo tự động khi server start lần đầu
- Upload files được lưu tại `server/uploads/`
- Frontend lưu sessionId và analysis data vào localStorage
- Backend sử dụng better-sqlite3 cho development (có thể chuyển sang PostgreSQL cho production)

## 🐛 Troubleshooting

1. **Backend không start**: Check GEMINI_API_KEY trong .env
2. **CORS errors**: Check CORS_ORIGIN trong backend .env
3. **API calls fail**: Đảm bảo backend đang chạy và port đúng

