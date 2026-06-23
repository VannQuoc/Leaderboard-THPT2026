# Bảng Xếp Hạng Điểm Thi THPT Quốc Gia 2026 - Trường THPT Lý Tự Trọng

Dự án này là hệ thống tra cứu và hiển thị bảng xếp hạng điểm thi THPT Quốc Gia năm 2026 của học sinh trường THPT Lý Tự Trọng. 
Bao gồm một ứng dụng frontend (Client) và một ứng dụng backend (Server).

## 🚀 Tính Năng Chính
- **Tra cứu điểm thi**: Tìm kiếm kết quả thi theo số báo danh nhanh chóng.
- **Bảng xếp hạng**: Hiển thị bảng xếp hạng điểm cao nhất theo từng môn thi, tổ hợp môn, và khối thi.
- **Thống kê dữ liệu**: Tổng hợp thông tin cơ bản về kỳ thi.

## 💻 Yêu Cầu Hệ Thống
- **Node.js** (Phiên bản >= 18.x)
- **NPM**

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Nhanh (Quick Setup)

Dự án sử dụng **NPM Workspaces** (Monorepo), giúp quản lý cả phần client và server tập trung. Các bạn chỉ cần chạy lệnh ở thư mục gốc của dự án.

### 1. Cài đặt các gói phụ thuộc (Dependencies)
Mở terminal tại thư mục gốc của dự án (`Leaderboard-THPT2026`) và chạy:
```bash
npm install
```

### 2. Chuẩn bị dữ liệu
Nếu bạn cần thu thập và import dữ liệu điểm thi vào cơ sở dữ liệu:
```bash
npm run crawl  # Để crawl/thu thập dữ liệu điểm thi mới nhất
npm run import # Để import dữ liệu (từ Excel hoặc JSON) vào hệ thống
```

### 3. Khởi chạy ứng dụng (Môi trường Development)
Bạn cần mở 2 terminal để chạy song song Server và Client.

**Terminal 1 (Khởi chạy Server):**
```bash
npm run dev:server
```

**Terminal 2 (Khởi chạy Client):**
```bash
npm run dev:client
```

### 4. Build và chạy Production
Để đóng gói và chạy ứng dụng ở chế độ chính thức:
```bash
npm run build:client # Build frontend
npm run start        # Chạy server
```

## 📂 Cấu Trúc Thư Mục Chính
- `/client`: Mã nguồn giao diện Frontend.
- `/server`: Mã nguồn Backend Server (API và script crawl dữ liệu).
- `DS_PHONG_THI_SBD_CHINH_XAC.xlsx`: Tập tin danh sách phòng thi, số báo danh của thí sinh.

---
*Dự án hỗ trợ học sinh và giáo viên trường THPT Lý Tự Trọng theo dõi, đánh giá kết quả kỳ thi THPT năm 2026 một cách trực quan và tiện lợi nhất.*
