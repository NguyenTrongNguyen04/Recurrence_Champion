# Hướng dẫn thiết lập Firebase Authentication

File này hướng dẫn bạn cách thiết lập Firebase Authentication cho dự án TestFlow AI.

##  Bước 1: Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** hoặc chọn project có sẵn
3. Nhập tên project và chọn region (ví dụ: `us-central`, `asia-southeast1`)
4. Click **"Create project"** và đợi Firebase khởi tạo

##  Bước 2: Đăng ký Web App

1. Trong Firebase Console, vào **Project Settings** (biểu tượng bánh răng)
2. Scroll xuống phần **"Your apps"**, click **"Add app"** → chọn icon **Web** (`</>`)
3. Nhập tên app (ví dụ: `testflow-ai-web`)
4. **QUAN TRỌNG**: KHÔNG bật Firestore hoặc Realtime Database (chỉ cần Authentication)
5. Click **"Register app"**
6. Bạn sẽ thấy Firebase configuration object. **SAO CHÉP** toàn bộ thông tin này

##  Bước 3: Bật Email/Password Authentication

1. Trong Firebase Console, vào menu **Authentication**
2. Click tab **"Sign-in method"**
3. Click vào **"Email/Password"**
4. Bật toggle **"Enable"**
5. (Tùy chọn) Có thể bật **"Email link (passwordless sign-in)"** nếu muốn
6. Click **"Save"**

##  Bước 4: Cấu hình Authorized Domains (nếu cần)

1. Trong **Authentication** → **Settings** → **Authorized domains**
2. Đảm bảo các domain sau được thêm:
   - `localhost` (đã có sẵn)
   - Domain production của bạn (nếu có)

##  Bước 5: Lấy Firebase Config và tạo file .env

1. Quay lại **Project Settings** → **General** → **Your apps**
2. Tìm app web bạn vừa tạo, click vào nó
3. Bạn sẽ thấy Firebase config object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

4. Tạo file `.env` ở thư mục root của dự án (cùng cấp với `package.json`)
5. Copy nội dung sau vào file `.env` và điền giá trị tương ứng:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Ví dụ cụ thể:**
```env
VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
VITE_FIREBASE_AUTH_DOMAIN=testflow-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=testflow-ai
VITE_FIREBASE_STORAGE_BUCKET=testflow-ai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

##  Bước 6: Cài đặt dependencies và chạy ứng dụng

1. Cài đặt packages:
```bash
npm install
```

2. Khởi động dev server:
```bash
npm run dev
```

3. Mở trình duyệt tại `http://localhost:3000`

##  Kiểm tra hoạt động

1. Vào trang login (`http://localhost:3000/#/login`)
2. Click **"Đăng ký ngay"** để tạo tài khoản mới
3. Nhập email và password (tối thiểu 6 ký tự)
4. Sau khi đăng ký thành công, bạn sẽ tự động được đăng nhập
5. Kiểm tra trong Firebase Console → **Authentication** → **Users** để xem user mới được tạo
6. Test đăng xuất bằng cách click avatar → **"Đăng xuất"**

## 🔐 Lưu ý bảo mật

- **KHÔNG** commit file `.env` vào git (đã được thêm vào `.gitignore`)
- Firebase API keys có thể public trong client-side code, nhưng vẫn nên hạn chế trong production
- Xem thêm về [Firebase Security Rules](https://firebase.google.com/docs/rules)

## 🐛 Xử lý lỗi thường gặp

### Lỗi: "Firebase: Error (auth/invalid-api-key)"
- Kiểm tra lại giá trị `VITE_FIREBASE_API_KEY` trong file `.env`
- Đảm bảo không có khoảng trắng thừa

### Lỗi: "Firebase: Error (auth/unauthorized-domain)"
- Kiểm tra **Authorized domains** trong Firebase Console
- Đảm bảo `localhost` đã được thêm vào

### Lỗi: "Firebase: Error (auth/operation-not-allowed)"
- Kiểm tra Email/Password đã được bật trong **Authentication** → **Sign-in method**

## 📚 Tài liệu tham khảo

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)

