# PK LASER OS

Nền tảng quản trị vận hành dành cho Công ty Cổ phần PK LASER.

## Phạm vi nền tảng

- Đăng nhập và phân quyền: quản trị, kỹ thuật, kinh doanh
- Quản lý máy theo serial và mã nội bộ (ví dụ `PKL-D6020`)
- Phiếu dịch vụ từ QR đến phân công, xử lý và nghiệm thu
- Kho phụ tùng, vật tư tiêu hao
- CRM, doanh số và KPI
- Dashboard quản trị và dữ liệu vận hành

## Khởi tạo tài khoản quản trị đầu tiên

Sau khi cấu hình `DATABASE_URL`, `SESSION_SECRET` và áp dụng migration đã được duyệt:

1. Đặt biến `ADMIN_BOOTSTRAP_TOKEN` thành một chuỗi bí mật ngẫu nhiên trong môi trường máy chủ.
2. Mở `/setup-admin`, nhập mã thiết lập và thông tin tài khoản quản trị đầu tiên.
3. Đăng nhập; trang thiết lập tự đóng sau khi có tài khoản đầu tiên.
4. Xóa biến `ADMIN_BOOTSTRAP_TOKEN` khỏi môi trường máy chủ.

Tài khoản quản trị vào mục **Tài khoản và phân quyền** để tạo tài khoản nhân viên, gán vai trò, khóa/mở tài khoản và đặt lại mật khẩu. Mật khẩu khởi tạo/đặt lại tối thiểu 12 ký tự và bắt buộc đổi khi đăng nhập.

## Chạy cục bộ

```bash
cp .env.example .env.local
npm install
npm run dev
```

Mở `http://localhost:3000`. Endpoint kiểm tra hệ thống: `/api/health`.

## Kiểm tra trước khi triển khai

```bash
npm run typecheck
npm run lint
npm run build
```

## Trạng thái

Đang triển khai nền tảng production theo từng pull request có kiểm tra.
