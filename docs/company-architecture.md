# PK LASER OS — kiến trúc triển khai công ty

## Phạm vi và nguyên tắc
Một ứng dụng, cùng cơ sở dữ liệu nghiệp vụ có phân quyền. Giữ Cloudflare Pages + Functions + D1 hiện tại; file ảnh/tài liệu cần R2 khi triển khai. Không coi schema có sẵn là module đã hoạt động. Không coi build thành công là nghiệm thu production.

## Quy trình mục tiêu
Khách hàng → cơ hội → báo giá có phiên bản → đơn hàng → yêu cầu mua/sản xuất → nhập kho/QC → giao hàng → thu tiền → bảo hành/bảo trì → cơ hội bán vật tư tiếp theo.

## Miền dữ liệu cần xây tiếp
| Miền | Dữ liệu chính | Điều kiện nghiệm thu |
|---|---|---|
| Nhân sự/quyền | users, roles, permissions, role_assignments | Nhân viên chỉ có quyền công việc; không dùng admin thay vai trò còn thiếu |
| CRM | customers, contacts, opportunities, activities | Không trùng khách; nguồn dữ liệu và sự đồng ý liên hệ có lưu vết |
| Kinh doanh | quotes, quote_versions, orders, order_lines | Không sửa báo giá đã duyệt; giảm giá ngoài hạn mức phải duyệt |
| Mua hàng | requisitions, purchase_orders, receipts | Người đề nghị khác người duyệt; kiểm tra model tương thích |
| Kho | stock_movements, reservations, warehouses | Tồn suy ra từ ledger; giao dịch nguyên tử; không xuất âm |
| Sản xuất | jobs, drawings, BOM, operations, inspections | Khóa phiên bản bản vẽ theo lệnh; QC trước giao |
| Kế toán | invoices, payments, allocations | Đối soát với phần mềm kế toán pháp định, không tự nhận là sổ kế toán đầy đủ |
| Dịch vụ | machines, tickets, repair_actions | Kiểm thử quyền, trạng thái, kết quả nghiệm thu và lịch sử |
| Tri thức AI | documents, citations, cases, evaluations | Nguồn đúng model; ca được duyệt; phản hồi idempotent; đo chất lượng |

## Tự động hóa an toàn
Mỗi sự kiện có event_id duy nhất, phiên bản payload, người tạo và thời điểm. Bảng outbox được ghi cùng giao dịch nghiệp vụ. Worker xử lý idempotent, retry có giới hạn và hàng đợi lỗi. Thông báo, đơn mua, báo giá và lệnh điều khiển máy không được tự phát hành khi chưa có chính sách được duyệt.

## Cổng nghiệm thu trước production
1. D1 đúng tài khoản, môi trường staging riêng; backup và khôi phục thử.
2. Đăng nhập, phiên hết hạn, chống dò mật khẩu và bảo vệ request ghi.
3. Test thực tế mỗi quyền ở cả UI/API, chuyển trạng thái và thao tác đồng thời.
4. Kiểm tra QR bằng điện thoại; đóng ca → lịch sử → KPI.
5. AI không học lặp từ cùng phản hồi, không coi kết quả rejected là nguyên nhân xác nhận.
6. Kiểm tra giao diện desktop/mobile, lỗi mạng, dữ liệu rỗng, ký tự tiếng Việt.
7. Giám đốc duyệt người dùng, quy trình và phạm vi trước mở cho nhân viên.

## Tình trạng ở lần cập nhật này
Đã có phần mềm dịch vụ cơ bản và trung tâm hướng dẫn 10 vị trí. Các miền CRM, mua hàng, kế toán, sản xuất ở trên là đặc tả triển khai tiếp, chưa phải chức năng đã xây. Chưa có quyền Cloudflare/D1 production trong phiên làm việc này. Không tự triển khai lên pklaser.vn khi chưa xác minh ứng dụng đang phục vụ tên miền đó.
