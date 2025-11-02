<div align="center">
  <h1>🧪 Test Studio</h1>
  <p><strong>Testing, Execution & Reporting App - Powered by AI</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)
</div>

---

##  Mục lục

- [ Giới thiệu](#-giới-thiệu)
- [ Tính năng chính](#-tính-năng-chính)
- [ Quy trình làm việc (Workflow)](#-quy-trình-làm-việc-workflow)
- [ Kiến trúc hệ thống](#️-kiến-trúc-hệ-thống)
- [ Cài đặt và Chạy dự án](#-cài-đặt-và-chạy-dự-án)
- [ Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [ Tích hợp CI/CD](#-tích-hợp-cicd)
- [ AI Agent](#-ai-agent)
- [ Giao diện Demo](#-giao-diện-demo)
- [ Roadmap](#️-roadmap)
- [ License](#-license)

---

##  Giới thiệu

**Test Studio** là một ứng dụng web toàn diện hỗ trợ quy trình kiểm thử phần mềm tự động hóa thông minh cho doanh nghiệp. Hệ thống sử dụng AI để tự động sinh yêu cầu test và phạm vi test từ mô tả yêu cầu phần mềm, giúp:

-  **AI tự động sinh test cases** từ mô tả yêu cầu đầu vào (user stories, tài liệu dự án)
-  **Người dùng duyệt và chỉnh sửa** test cases do AI tạo ra
-  **Quản lý và thực thi test** tự động/manual với kết quả chi tiết
-  **Báo cáo trực quan** với dashboard và AI phân tích lỗi
-  **Tích hợp CI/CD** để tự động trigger test khi có thay đổi code

### Mục tiêu chính

-  **Giảm thiểu công sức viết test case thủ công** - AI tự động phân tích và sinh test cases
-  **Tăng độ chính xác** - AI phân tích ngữ nghĩa tự động từ yêu cầu
-  **Tính tương tác cao** - Người dùng kiểm duyệt phạm vi test trực quan
-  **Tích hợp dễ dàng** - Flow tự động từ test generation → execution → reporting
-  **Nâng cao chất lượng** - Phạm vi test bao phủ các kịch bản chính, luồng phụ và điều kiện biên

### Ưu điểm nổi bật

####  AI-Powered Test Generation
- **Giảm 80% thời gian viết test cases** - AI tự động sinh từ mô tả yêu cầu
- **Phạm vi test toàn diện** - Tự động bao phủ happy path, edge cases, error handling
- **Chất lượng cao** - AI phân tích ngữ nghĩa sâu để hiểu yêu cầu thực sự

####  Tích hợp mượt mà
- **Chỉ cần Next.js + Supabase** - Không cần backend riêng, dễ deploy
- **CI/CD integration đơn giản** - Chỉ cần 1 dòng curl để upload test results
- **RESTful API chuẩn** - Dễ dàng tích hợp với bất kỳ hệ thống nào

####  Trực quan & Thông minh
- **Dashboard realtime** - Biểu đồ và thống kê cập nhật ngay lập tức
- **AI phân tích lỗi** - Tự động tóm tắt và gợi ý hướng fix
- **Giao diện hiện đại** - Dark theme, UX/UI được tối ưu

####  Tập trung vào Testing → Execution → Reporting
- **Workflow rõ ràng** - 3 bước chính: Generate → Execute → Report
- **End-to-end solution** - Từ test planning đến reporting
- **Phù hợp cho hackathon** - Demo flow ấn tượng, dễ pitch

---

##  Tính năng chính

### AI Test Generation (Bước 1)
- **Đọc và phân tích yêu cầu**: 
  - Nhận đầu vào là văn bản mô tả yêu cầu phần mềm, tính năng, hoặc user stories
  - Hỗ trợ upload tài liệu dự án (PDF, DOCX, TXT)
  - Gọi API AI (Gemini) để phân tích ngữ nghĩa dữ liệu đầu vào
- **Tự động sinh test cases**:
  - Tạo danh sách yêu cầu test có cấu trúc (JSON)
  - Mô tả test cases sơ bộ: các bước, điều kiện đầu vào, kết quả mong đợi
  - Xác định phạm vi test: kịch bản chính, luồng phụ, điều kiện biên
  - Phân loại test cases theo priority và category
- **Giao diện duyệt test cases**:
  - Hiển thị danh sách test cases với checkbox để chọn/bỏ chọn
  - Cho phép chỉnh sửa mô tả test case trực tiếp
  - Trạng thái duyệt rõ ràng (pending, approved, rejected)
  - Tìm kiếm và lọc test cases theo category, priority

### Testing
- **Quản lý test cases/test suite**: Tạo và tổ chức test cases từ dữ liệu đã chốt
- **Nhận file kết quả test**: Từ GitHub Actions (JUnit XML, JSON, Playwright, PyTest, v.v.)
- **Hỗ trợ đa định dạng**: Tự động parse và xử lý nhiều loại test report

### Execution
- **Thực thi test tự động/manual**: Kích hoạt test và lưu lại kết quả, logs
- **Lưu & hiển thị test runs**: Metadata đầy đủ (branch, commit, author, thời gian)
- **Theo dõi realtime**: Dashboard cập nhật ngay khi có test run mới
- **Lịch sử test runs**: Xem lại tất cả các lần chạy test trước đó
- **Retest tự động**: Tự động chạy lại test khi có fix

### Reporting
- **Dashboard tổng hợp**: 
  - Biểu đồ Pass/Fail %
  - Thống kê lịch sử 7 ngày
  - Metric cards (tỷ lệ pass, số test fail, thời gian chạy, tổng số test)
- **Chi tiết test**: 
  - Danh sách test case đầy đủ
  - Thời gian thực thi từng test
  - Trạng thái pass/fail/skip
  - Stack trace cho test lỗi
- **Bộ lọc & tìm kiếm**: 
  - Lọc theo branch
  - Lọc theo tác giả (author)
  - Lọc theo ngày tháng
  - Tìm kiếm test case

### AI Agent
- **Sinh test cases tự động** (Bước 1):
  - Phân tích ngữ nghĩa yêu cầu phần mềm
  - Tự động tạo danh sách test cases với các bước chi tiết
  - Xác định phạm vi test bao gồm happy path, edge cases, error handling
  - Trả về cấu trúc JSON có tổ chức
- **Tóm tắt lỗi tự động**: Phân tích và tóm tắt nguyên nhân lỗi
- **Gợi ý hướng fix**: Đề xuất cách khắc phục dựa trên error message và stack trace
- **Gom nhóm lỗi**: Nhận diện lỗi lặp lại / flaky tests
- **Phân tích xu hướng**: Đánh giá chất lượng test qua thời gian

### Lưu trữ
- **Supabase Database**: Lưu trữ metadata và test results (JSONB)
- **Storage (tùy chọn)**: Lưu screenshot hoặc log files

### Bảo mật
- **Token-based Auth**: Bảo vệ API upload với Bearer token
- **GitHub Integration**: Tích hợp an toàn với GitHub Actions

---

##  Quy trình làm việc (Workflow)

### Luồng tổng thể

```
Bước 1: AI Test Generation
┌──────────────────────────────────────┐
│  User nhập mô tả yêu cầu            │
│  (text hoặc upload document)        │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  AI Agent (Gemini API)               │
│  - Phân tích ngữ nghĩa               │
│  - Sinh test cases & phạm vi test   │
│  - Trả về JSON có cấu trúc           │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  User Duyệt Test Cases               │
│  - Tick/untick test cases            │
│  - Chỉnh sửa mô tả                   │
│  - Xác nhận phạm vi test             │
└──────────────┬───────────────────────┘
               │
               ▼
Bước 2: Test Management & Execution
┌──────────────────────────────────────┐
│  Tạo Test Suite từ test cases đã chốt│
│  - Quản lý test cases                │
│  - Tổ chức thành test suites         │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Thực thi Test                       │
│  - Automatic (CI/CD)                 │
│  - Manual execution                  │
│  - Lưu kết quả & logs                │
└──────────────┬───────────────────────┘
               │
               ▼
Bước 3: Reporting
┌──────────────────────────────────────┐
│  Dashboard & Báo cáo                  │
│  - Tổng hợp kết quả                  │
│  - Biểu đồ trực quan                  │
│  - AI phân tích lỗi                   │
│  - Export PDF/HTML                    │
└──────────────────────────────────────┘
```

##  Kiến trúc hệ thống

### Flow AI Test Generation

```
┌──────────────────────────────┐
│   User Input                 │
│   (Requirements/User Stories)│
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   /api/generate-tests (API)  │
│   - Preprocess text          │
│   - Call Gemini API          │
│   - Parse AI response        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   Gemini AI API              │
│   - Semantic analysis        │
│   - Generate test cases      │
│   - Return structured JSON   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   Frontend: Review UI        │
│   - Display test cases       │
│   - Checkbox selection       │
│   - Edit functionality       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   Supabase Database          │
│   - test_cases               │
│   - test_suites              │
│   - projects                 │
└──────────────────────────────┘
```

### Flow Test Execution & Reporting

```
┌───────────────────────────────┐
│      GitHub Actions           │
│  (run test, export JUnit XML) │
└──────────────┬────────────────┘
               │ POST via CURL
               ▼
        ┌──────────────────────┐
        │  /api/upload (API)   │
        │  - parse XML/JSON     │
        │  - validate data      │
        │  - save to database   │
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │  Supabase Database   │
        │  - test_runs         │
        │  - test_results      │
        │  - projects          │
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │  React Dashboard     │
        │  - View runs & stats │
        │  - AI error summary  │
        │  - Charts & reports  │
        └──────────────────────┘
```

### Công nghệ sử dụng

- **Frontend**: React 19 + TypeScript + Vite
- **UI Library**: Custom components với dark theme
- **Charts**: Recharts
- **Routing**: React Router DOM
- **Backend API**: 
  - API Routes (có thể dùng Next.js API Routes hoặc Express)
  - Supabase Edge Functions (tùy chọn)
- **Database**: Supabase (PostgreSQL + JSONB)
- **AI**: 
  - Google Gemini API (khuyến nghị cho test generation)
  - OpenAI GPT (tùy chọn)
- **CI/CD**: GitHub Actions integration
- **Build Tool**: Vite 6.2
- **Language**: TypeScript 5.8

---

##  Cài đặt và Chạy dự án

### Yêu cầu hệ thống

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 (hoặc yarn/pnpm)
- **Git**: Để clone repository

### Bước 1: Clone repository

```bash
git clone https://github.com/yourusername/test-studio.git
cd test-studio
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Cấu hình biến môi trường

Tạo file `.env.local` trong thư mục gốc:

```env
# API Keys (chọn một trong hai)
GEMINI_API_KEY=your_gemini_api_key_here
# hoặc
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (nếu sử dụng)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Upload Token (để bảo vệ endpoint upload)
UPLOAD_TOKEN=your_secure_random_token_here
```

**Lưu ý**: 
- Bạn có thể lấy Gemini API key tại: https://makersuite.google.com/app/apikey
- Hoặc OpenAI API key tại: https://platform.openai.com/api-keys
- Tạo Supabase project miễn phí tại: https://supabase.com

### Bước 4: Chạy ứng dụng ở chế độ development

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:3000**

### Bước 5: Build cho production

```bash
npm run build
npm run preview
```

---

##  Hướng dẫn sử dụng

### Bước 1: AI Sinh Test Cases

1. **Nhập mô tả yêu cầu**:
   - Vào trang **Generate Tests** (hoặc trang chính)
   - Nhập văn bản mô tả yêu cầu phần mềm, tính năng, hoặc user stories
   - Hoặc upload file tài liệu (PDF, DOCX, TXT)

2. **AI phân tích và sinh test cases**:
   - Click nút **" Generate Test Cases"**
   - Hệ thống gọi Gemini API để phân tích ngữ nghĩa
   - AI tự động tạo danh sách test cases với:
     - Mô tả test case
     - Các bước thực hiện
     - Điều kiện đầu vào
     - Kết quả mong đợi
     - Phân loại (happy path, edge case, error handling)

3. **Duyệt và chỉnh sửa test cases**:
   - Xem danh sách test cases do AI tạo ra
   -  **Tick** các test cases muốn giữ lại
   -  **Bỏ tick** các test cases không cần thiết
   -  **Chỉnh sửa** mô tả test case nếu cần
   -  **Lọc** theo category, priority để dễ quản lý

4. **Xác nhận và chốt**:
   - Click **"Approve & Save"** để chốt phạm vi test
   - Test cases đã duyệt sẽ được lưu vào database
   - Chuyển sang bước quản lý test cases

### Bước 2: Quản lý Test Cases & Thực thi

1. **Xem Test Suites**:
   - Trang **Test Cases** hiển thị tất cả test cases đã được duyệt
   - Tổ chức test cases thành test suites
   - Quản lý metadata (priority, tags, assignee)

2. **Thực thi Test**:
   - **Tự động**: Tích hợp với CI/CD để tự động chạy khi có commit
   - **Manual**: Chọn test cases và click "Run Tests"
   - Theo dõi tiến trình execution realtime

3. **Xem kết quả**:
   - Trang **Execution** hiển thị kết quả test run
   - Xem chi tiết pass/fail của từng test case
   - Download logs và screenshots (nếu có)

### Bước 3: Báo cáo và Phân tích

1. **Dashboard tổng hợp**:
   - Truy cập trang **Dashboard** để xem:
     - Tỷ lệ pass/fail của test run mới nhất
     - Biểu đồ thống kê 7 ngày gần nhất
     - Danh sách test cases với trạng thái chi tiết

2. **Lịch sử Test Runs**:
   - Trang **History** hiển thị:
     - Tất cả các test runs đã chạy
     - Lọc theo branch, author, date range
     - Click vào từng run để xem chi tiết

3. **Phân tích lỗi với AI**:
   - Trang **Analyze**:
     - Chọn test case lỗi hoặc paste error message
     - Click **" Analyze with AI"**
     - AI Agent sẽ phân tích và đưa ra:
       - Tóm tắt nguyên nhân lỗi
       - Gợi ý hướng khắc phục
       - Liên kết đến test case liên quan

### Cài đặt

Trang **Settings**:
- Cấu hình API keys (Gemini, OpenAI)
- Thiết lập thông báo
- Quản lý projects và repositories
- Cấu hình CI/CD integration

---

##  Tích hợp CI/CD

### GitHub Actions Integration

Thêm workflow sau vào `.github/workflows/test.yml`:

```yaml
name: Run Tests and Report

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test -- --reporter=junit --outputFile=test-results.xml
      
      - name: Upload test results to Test Studio
        run: |
          curl -X POST "https://your-test-studio-domain.com/api/upload" \
            -H "Authorization: Bearer ${{ secrets.TEST_STUDIO_TOKEN }}" \
            -F "branch=${{ github.ref_name }}" \
            -F "commit=${{ github.sha }}" \
            -F "author=${{ github.actor }}" \
            -F "project=your-project-name" \
            -F "file=@test-results.xml"
```

### Cấu hình Secrets

Vào GitHub Repository → Settings → Secrets → Actions, thêm:
- `TEST_STUDIO_TOKEN`: Token bảo mật để gọi API upload

### Các format test report được hỗ trợ

- **JUnit XML**: Jest, PyTest, JUnit, PHPUnit
- **JSON**: Playwright, Cypress, Mocha
- **TXT/Plain**: Custom format (cần parser tùy chỉnh)

### Ví dụ với các test framework

#### Jest

```bash
npm test -- --coverage --testResultsProcessor=jest-junit
curl -X POST "..." -F "file=@junit.xml"
```

#### Playwright

```bash
npx playwright test --reporter=json
curl -X POST "..." -F "file=@playwright-report/results.json"
```

#### PyTest

```bash
pytest --junitxml=results.xml
curl -X POST "..." -F "file=@results.xml"
```

---

##  AI Agent

### Tính năng AI trong Test Studio

#### 1.  AI Sinh Test Cases (Bước 1 - Quan trọng nhất)

**Quy trình AI phân tích và sinh test cases**:

1. **Thu thập đầu vào**:
   - Nhận văn bản mô tả yêu cầu phần mềm, tính năng, hoặc user stories
   - Hỗ trợ upload tài liệu dự án (PDF, DOCX, TXT)
   - Preprocess text để chuẩn hóa format

2. **Phân tích ngữ nghĩa với Gemini API**:
   - Gọi API AI trên nền tảng Gemini để phân tích ngữ nghĩa dữ liệu đầu vào
   - AI tư duy và hiểu các yêu cầu chức năng
   - Xác định các thành phần cần test

3. **Tự động sinh test cases**:
   AI tạo ra danh sách yêu cầu test bao gồm:
   - **Mô tả test cases sơ bộ**: 
     - Các bước thực hiện chi tiết
     - Điều kiện đầu vào (input conditions)
     - Kết quả mong đợi (expected results)
   - **Xác định phạm vi test**:
     - Kịch bản chính (happy path)
     - Luồng phụ (alternative flows)
     - Điều kiện biên (edge cases)
     - Error handling scenarios

4. **Trả về cấu trúc JSON**:
   ```json
   {
     "testCases": [
       {
         "id": "TC-001",
         "title": "User login with valid credentials",
         "description": "Verify user can login successfully",
         "steps": ["1. Navigate to login page", "2. Enter valid email and password", "3. Click login"],
         "input": "Valid email: user@example.com, Password: SecurePass123",
         "expectedResult": "User is redirected to dashboard",
         "category": "authentication",
         "priority": "high",
         "type": "happy_path"
       },
       {
         "id": "TC-002",
         "title": "User login with invalid password",
         "description": "Verify error message for invalid password",
         "steps": ["1. Navigate to login page", "2. Enter valid email but wrong password", "3. Click login"],
         "input": "Valid email: user@example.com, Password: WrongPass",
         "expectedResult": "Error message: 'Invalid password' is displayed",
         "category": "authentication",
         "priority": "medium",
         "type": "error_handling"
       }
     ],
     "testScope": {
       "mainScenarios": 5,
       "edgeCases": 3,
       "errorHandling": 4,
       "total": 12
     }
   }
   ```

5. **Hiển thị cho người dùng**:
   - Hiển thị danh sách test cases với checkbox
   - Cho phép chỉnh sửa test case
   - Trạng thái duyệt rõ ràng

**Prompt Engineering cho AI**:
- Prompt được tối ưu để AI hiểu rõ yêu cầu
- Yêu cầu AI trả về format JSON chuẩn
- Bao gồm examples để AI học pattern

#### 2.  Phân tích lỗi thông minh

- Đọc stack trace và error message
- Xác định nguyên nhân gốc rễ
- Tóm tắt ngắn gọn, dễ hiểu

#### 3.  Đề xuất giải pháp

- Gợi ý cách fix dựa trên loại lỗi
- Liên kết đến documentation liên quan
- Đề xuất test case bổ sung

#### 4.  Phát hiện pattern

- Nhận diện lỗi lặp lại (flaky tests)
- Phân tích xu hướng qua thời gian
- Cảnh báo về regression

### Sử dụng AI Agent

#### Sinh Test Cases:

1. Vào trang **Generate Tests**
2. Nhập hoặc upload mô tả yêu cầu
3. Click **" Generate Test Cases"**
4. Đợi AI phân tích và sinh test cases
5. Duyệt và chỉnh sửa test cases
6. Click **"Approve & Save"** để chốt

#### Phân tích lỗi:

1. Vào trang **Analyze**
2. Paste error message hoặc chọn test case lỗi
3. Click **" Analyze with AI"**
4. Xem kết quả phân tích và gợi ý

### Cấu hình AI

Trong file `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Hoặc sử dụng OpenAI:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

**Lưu ý**: Gemini API được khuyến nghị cho việc sinh test cases do khả năng phân tích ngữ nghĩa tốt và chi phí hợp lý.

---

##  Giao diện Demo

### Tham khảo các ứng dụng tương tự

1. **Allure Report Demo**
   - Link: https://demo.qameta.io/allure/
   - Giao diện dark UI, menu bên trái
   - Biểu đồ Pass/Fail, test details với log + screenshot

2. **ReportPortal Live Demo**
   - Link: https://reportportal.epam.com/ui/#default_personal/dashboard
   - Dashboard nhiều widget
   - Phân tích lỗi, nhóm lỗi trùng nhau

### Layout của Test Studio

```
┌─────────────────────────────────────────────┐
│  Header: Test Studio | User Menu            │
├─────────────┬──────────────────────────────────┤
│                 │  Dashboard (Main View)           │
│ Sidebar    │  ┌──────────┐ ┌──────────┐      │
│ - Home    │  │ Pass %   │ │ Fail #   │      │
│ - Runs      │  │ 92.5%    │ │ 3        │      │
│ - History   │  └──────────┘ └──────────┘      │
│ - Analyze  │  ┌────────────────────────┐     │
│ - Settings  │ │  Pass/Fail Chart       │     │
│                  │ │  (7 days history)      │     │
│                  │ └────────────────────────┘     │
│                  │  ┌────────────────────────┐    │
│                  │  │  Recent Test Runs      │    │
│                  │  │  Table with filters    │    │
│                  │  └────────────────────────┘    │
└──────────┴──────────────────────────────────┘
```

---

##  Roadmap

###  MVP (Hiện tại)

- [x] Dashboard hiển thị test results
- [x] API upload nhận test reports
- [x] Lưu trữ vào Supabase
- [x] Biểu đồ thống kê cơ bản
- [x] UI dark theme hiện đại
- [x] AI sinh test cases từ mô tả yêu cầu (Gemini API)
- [x] Giao diện duyệt test cases với checkbox
- [x] Chỉnh sửa test cases trực tiếp trên UI

###  Phiên bản 1.1 (Sắp tới)

- [ ] Tối ưu AI prompt để sinh test cases chính xác hơn
- [ ] Upload và parse tài liệu PDF/DOCX
- [ ] AI Agent phân tích lỗi tự động chi tiết hơn
- [ ] Export test cases ra file Excel/CSV
- [ ] So sánh 2 test runs
- [ ] Mobile responsive hoàn chỉnh
- [ ] Test suite management nâng cao

###  Phiên bản 1.2 (Sắp tới)

- [ ] Slack bot báo cáo hàng ngày
- [ ] Export báo cáo PDF/HTML đẹp mắt
- [ ] Tự động retest khi có fix
- [ ] Gom nhóm lỗi tự động (flaky test detection)
- [ ] Phân tích xu hướng test quality
- [ ] Custom dashboard widgets

###  Phiên bản 2.0 (Tương lai)

- [ ] Autonomous QA Agent (LangGraph)
- [ ] AI tự động tạo test case từ source code
- [ ] Tích hợp với Jira, Linear, Notion
- [ ] Multi-project workspace
- [ ] Webhook notifications
- [ ] Test execution sandbox (WebContainer)
- [ ] Collaborative review (team duyệt test cases)
- [ ] Version control cho test cases

---

##  Development

### Cấu trúc thư mục

```
test-studio/
├── components/          # React components
│   ├── ui/             # UI components (Button, Card, Table...)
│   ├── layout/         # Layout components (Sidebar, Header...)
│   └── icons/          # Icon components
├── pages/              # Page components
│   ├── DashboardPage.tsx
│   ├── ExecutionPage.tsx
│   ├── HistoryPage.tsx
│   └── AnalyzePage.tsx
├── data/               # Mock data và utilities
├── types.ts            # TypeScript type definitions
├── constants.tsx       # App constants
└── vite.config.ts      # Vite configuration
```

### Scripts có sẵn

```bash
npm run dev          # Chạy development server
npm run build        # Build production
npm run preview      # Preview production build
```

### Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Mở Pull Request

---

##  License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

##  Tác giả

Được phát triển cho Hackathon với ❤️

**Liên hệ**:
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

<div align="center">
  <p>Made with ❤️ for better software quality</p>
  <p> Star this repo if you find it helpful!</p>
</div>
