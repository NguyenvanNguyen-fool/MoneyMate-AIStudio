# 💰 MoneyMate — Personal Finance Management

> **MoneyMate** là ứng dụng quản lý tài chính cá nhân hiện đại theo phong cách **Premium Dark Fintech**. Ứng dụng giúp theo dõi thu chi, phân tích dòng tiền thông minh bằng biểu đồ trực quan, kiểm soát ngân sách tháng và đồng hành cùng các mục tiêu tiết kiệm dài hạn.

---

## ✨ Điểm nổi bật (Key Features)

### 1. 📊 Tổng quan tài chính & Chỉ số trọng yếu (Financial Metrics)
- **Bộ 3 thẻ tài chính cốt lõi**: Tổng thu nhập, Tổng chi tiêu và Số dư tài khoản thực tế.
- Định dạng tiền tệ VND chuẩn xác, typography sắc nét, màu sắc phân cấp rõ ràng (Xanh lá thu nhập `#75E0A7`, Đỏ hồng chi tiêu `#F87171`, Xanh dương số dư `#60A5FA`).

### 2. 📈 Phân tích dòng tiền & Cơ cấu chi tiêu (Interactive Visualizations)
- **Biểu đồ cột dòng tiền (Recharts)**: Hỗ trợ linh hoạt chuyển đổi xem **Theo ngày** trong tháng hoặc **Theo 6 tháng gần nhất**.
- **Biểu đồ tròn cơ cấu chi tiêu**: Thống kê tỷ lệ phần trăm theo từng danh mục (Ăn uống, Nhà cửa, Di chuyển, Mua sắm, Giáo dục, v.v.).
- Tùy biến Dark Theme đồng bộ, Tooltip hiển thị chi tiết và nhạy bén.

### 3. 💳 Quản lý giao dịch thông minh (Transaction Management)
- Ghi nhận thu / chi nhanh chóng với bộ lọc danh mục và ngày giao dịch.
- Hỗ trợ đầy đủ các thao tác CRUD (Tạo mới, Tìm kiếm, Chỉnh sửa, Xóa).
- Cơ chế validation dữ liệu trực tiếp, hiển thị thông báo lỗi rõ ràng và mượt mà.

### 4. 🎯 Ngân sách chi tiêu tháng (Monthly Budget Tracking)
- Thiết lập hạn mức chi tiêu cho từng tháng cụ thể.
- Thanh tiến độ (Progress bar) trực quan với cơ chế cảnh báo thông minh:
  - 🟢 **Bình thường**: Chi tiêu dưới 80% ngân sách.
  - 🟡 **Cảnh báo**: Chi tiêu đạt từ 80% - 99% ngân sách.
  - 🔴 **Vượt ngân sách**: Cảnh báo tức thì khi chi tiêu vượt ngưỡng dự kiến.

### 5. 🏆 Mục tiêu tiết kiệm (Savings Goals)
- Tạo và theo dõi tiến độ tích lũy tài chính (mua nhà, mua xe, quỹ khẩn cấp, du lịch...).
- Nạp thêm tiền tích lũy trực tiếp, tự động tính tỷ lệ hoàn thành và gắn huy hiệu đạt mục tiêu.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS, Custom CSS Variables (Design tokens)
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Quality & Linting**: Oxlint

### Backend & Database Integration (API Contract)
- **Backend Architecture**: ASP.NET Core Web API (.NET)
- **Database**: SQL Server / Entity Framework Core
- **API Endpoints**:
  - `GET /api/transactions` & `POST/PUT/DELETE /api/transactions`
  - `GET /api/budgets?month=YYYY-MM` & `POST /api/budgets`
  - `GET /api/goals` & `POST/PUT/DELETE /api/goals`

---

## 🎨 Thiết kế giao diện (Design System)

Ứng dụng tuân theo ngôn ngữ thiết kế **Premium Dark Fintech**:
- **Canvas / Background**: Đen than `#111318` dịu mắt, chống mỏi mắt khi sử dụng lâu.
- **Sidebar & Panels**: `#15181E` tách bạch tinh tế.
- **Surface Cards**: `#1B1E24` với viền mảnh `#30343B` sang trọng.
- **Accent Color**: Xanh mint `#75E0A7` tràn đầy năng lượng tích cực về tài chính.
- **Responsive chuẩn**: Tối ưu hiển thị hoàn hảo trên Desktop (1440px), Tablet (768px) và Mobile (390px).

---

## 🚀 Hướng dẫn cài đặt & Chạy ứng dụng (Getting Started)

### Yêu cầu môi trường
- **Node.js**: Phiên bản 18 trở lên
- **npm** hoặc **bun / pnpm / yarn**

### Các bước cài đặt

1. **Clone repository về máy**:
   ```bash
   git clone https://github.com/<username>/<repo-name>.git
   cd <repo-name>
   ```

2. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

3. **Cấu hình môi trường**:
   Sao chép file `.env.example` thành `.env` nếu cần điều chỉnh đường dẫn API Backend:
   ```bash
   cp .env.example .env
   ```

4. **Khởi chạy môi trường phát triển (Dev server)**:
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại: `http://localhost:3000`

5. **Build cho môi trường Production**:
   ```bash
   npm run build
   ```

---

## 📄 License
Dự án được phát triển cho mục đích học tập, nghiên cứu và quản lý tài chính cá nhân.
