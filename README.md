# PK LASER OS

Nền tảng quản trị vận hành dành cho Công ty Cổ phần PK LASER.

## Phạm vi nền tảng

- Đăng nhập và phân quyền: quản trị, kỹ thuật, kinh doanh
- Quản lý máy theo serial và mã nội bộ (ví dụ `PKL-D6020`)
- Phiếu dịch vụ từ QR đến phân công, xử lý và nghiệm thu
- Kho phụ tùng, vật tư tiêu hao
- CRM, doanh số và KPI
- Dashboard quản trị và dữ liệu vận hành

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
