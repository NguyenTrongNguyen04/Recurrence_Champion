# Frontend Mock Data Status - Cập nhật

## ✅ Đã cập nhật - Không còn dùng Mock Data

### 1. **AnalyzePage** ✅
- **Trước**: Dùng `mockData.suggestedTests`, `mockData.aiSummary`, `mockData.repo`
- **Sau**: Đọc từ `sessionStorage` (được lưu từ HomePage sau khi gọi API)
- **Nguồn dữ liệu**: 
  - `sessionStorage.getItem('analysisResult')` - Kết quả từ API
  - `sessionStorage.getItem('analysisType')` - Loại analysis (github/code/files)
- **Flow**: HomePage → API call → Save to sessionStorage → Navigate to AnalyzePage → Read from sessionStorage

### 2. **HomePage** ✅  
- **Trước**: Chỉ navigate, không gọi API
- **Sau**: Gọi 3 API endpoints:
  - `POST /api/analyze-github`
  - `POST /api/analyze-code`
  - `POST /api/analyze-files`
- **Status**: Hoàn toàn không dùng mock data

---

## ⚠️ Vẫn dùng Mock Data (cần cập nhật sau)

### 1. **DashboardPage**
- **Hiện tại**: Dùng `mockData.run`, `mockData.history`
- **Lý do**: Cần data từ test runs thực tế (sau khi upload test results)
- **Cách cập nhật**: 
  - Gọi `POST /api/dashboard` với test_runs data
  - Hoặc lưu test runs vào localStorage/database sau khi upload

### 2. **ExecutionPage**
- **Hiện tại**: Dùng `mockData.run`, `mockData.aiExplain`
- **Lý do**: Cần data từ test execution thực tế
- **Cách cập nhật**:
  - Nhận selected tests từ AnalyzePage
  - Gọi API để execute tests
  - Hiển thị results real-time

### 3. **HistoryPage**
- **Hiện tại**: Dùng `mockData.history`
- **Lý do**: Cần lịch sử test runs từ database/API
- **Cách cập nhật**:
  - Gọi API để lấy history
  - Lưu vào localStorage hoặc fetch từ backend

---

## 📋 Kế hoạch cập nhật

### Bước 1: Test Runs Data Management

Cần tạo một hệ thống để:
1. Lưu test runs sau khi upload
2. Fetch test runs từ API hoặc localStorage
3. Share data giữa các pages

### Bước 2: Update DashboardPage

```typescript
// Fetch test runs từ API hoặc localStorage
const testRuns = await fetchTestRuns();
const dashboardData = await fetch('/api/dashboard', {
  method: 'POST',
  body: JSON.stringify({ test_runs: testRuns })
});
```

### Bước 3: Update ExecutionPage

```typescript
// Nhận selected tests từ AnalyzePage
const selectedTests = getSelectedTestsFromSessionStorage();
// Execute tests và hiển thị results real-time
```

### Bước 4: Update HistoryPage

```typescript
// Fetch history từ API hoặc localStorage
const history = await fetchTestHistory();
```

---

## 🔄 Data Flow hiện tại

### Analyze Flow (✅ Hoàn chỉnh):
```
HomePage (User input)
    ↓
API Call (/api/analyze-github|code|files)
    ↓
Save to sessionStorage
    ↓
Navigate to AnalyzePage
    ↓
Read from sessionStorage
    ↓
Display results
```

### Test Execution Flow (⚠️ Chưa hoàn chỉnh):
```
AnalyzePage (Select tests)
    ↓
Navigate to ExecutionPage
    ↓
❌ Currently: Use mockData
✅ Should: Execute tests via API
    ↓
Display results
```

### Dashboard/History Flow (⚠️ Chưa hoàn chỉnh):
```
Upload Test Results (/api/upload)
    ↓
❌ Currently: Mock data in Dashboard
✅ Should: Fetch from API/localStorage
    ↓
Display in Dashboard/History
```

---

## 🚀 Để hoàn thiện

1. **Tạo API để fetch test runs**:
   - `GET /api/test-runs` - Lấy danh sách test runs
   - `GET /api/test-runs/:id` - Lấy chi tiết một test run

2. **Data persistence**:
   - LocalStorage cho client-side
   - Database cho production (Supabase/postgres)

3. **Real-time updates**:
   - WebSocket cho execution progress
   - Polling cho dashboard updates

---

## 📝 Notes

- **AnalyzePage**: ✅ Hoàn toàn không dùng mock data
- **HomePage**: ✅ Hoàn toàn không dùng mock data  
- **DashboardPage**: ⚠️ Vẫn dùng mock data (cần test runs thực tế)
- **ExecutionPage**: ⚠️ Vẫn dùng mock data (cần execution thực tế)
- **HistoryPage**: ⚠️ Vẫn dùng mock data (cần history thực tế)

Mock data hiện tại chỉ dùng cho:
- Demo/Debug purposes
- Fallback khi không có data thực tế

