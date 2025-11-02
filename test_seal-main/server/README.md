# TestStudio Backend Server

Backend server cho TestStudio - AI-powered testing system.

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` và thêm Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

   Server sẽ chạy tại `http://localhost:3001`

## API Endpoints

### Analysis
- `POST /api/analysis/analyze` - Phân tích code và sinh test cases
- `GET /api/analysis/session/:sessionId` - Lấy kết quả phân tích
- `PUT /api/analysis/test-case/:testCaseId` - Update test case
- `PUT /api/analysis/test-cases/batch` - Batch update test cases

### Execution
- `POST /api/execution/run` - Chạy test cases
- `GET /api/execution/run/:runId` - Lấy kết quả test run
- `GET /api/execution/history` - Lấy lịch sử test runs

### Health
- `GET /api/health` - Health check

## Database

Sử dụng SQLite (better-sqlite3) cho development. Database được tạo tự động tại `data/teststudio.db`.

Tables:
- `analysis_sessions` - Lưu các lần phân tích
- `test_cases` - Lưu test cases
- `test_runs` - Lưu các lần chạy test
- `test_results` - Lưu kết quả từng test

## Gemini AI Integration

Server sử dụng Gemini AI để:
1. Phân tích code và sinh test cases
2. Giải thích test failures
3. Đề xuất cách fix bugs

Prompt được tối ưu để tạo test cases chất lượng cao với đầy đủ thông tin (steps, input conditions, expected results).

