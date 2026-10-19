# PK LASER OS — Marketing Growth Engine

## Mục tiêu
Xây dựng lớp tăng trưởng marketing cho PK LASER: thu hút khách hàng tiềm năng đúng ngành, sản xuất nội dung chuyên môn, ghi nhận lead vào CRM, nuôi dưỡng theo sự đồng ý và đo chuyển đổi đến báo giá/đơn hàng. Ưu tiên API chính thức miễn phí hoặc có quota miễn phí; không giả định miễn phí vô hạn.

## Nguyên tắc
1. Không sửa production trong giai đoạn thiết kế; triển khai qua nhánh riêng, staging, kiểm thử và review.
2. Không tạo nguồn dữ liệu CRM thứ hai. Trước khi code phải xác định database chuẩn: mã nguồn nhánh Next.js hiện có dùng Neon/Postgres, còn ứng dụng đã rà soát có Worker/D1. Không dual-write hay di chuyển dữ liệu khi chưa đối chiếu.
3. Mỗi nhà cung cấp nằm sau một provider adapter riêng để có thể thay API.
4. API keys, OAuth refresh tokens và webhook secrets chỉ lưu trong secret store phía máy chủ; không gửi về trình duyệt, ghi log hay commit vào Git.
5. Có quota guard, cache, retry với backoff, circuit breaker, cảnh báo ngưỡng và công tắc tắt tích hợp.
6. Nội dung AI là bản nháp; người phụ trách duyệt trước khi đăng công khai hoặc gửi chiến dịch.
7. Lưu nguồn lead, bằng chứng đồng ý, mục đích, trạng thái unsubscribe/opt-out và suppression list. Không thu thập hàng loạt số điện thoại cá nhân từ nhóm Facebook hoặc né cơ chế bảo vệ nền tảng.

## Module A — Marketing Command Center
- Dashboard: lead mới, lead đủ điều kiện, tốc độ phản hồi, lịch nội dung, traffic SEO, chi phí theo kênh, báo giá, đơn hàng và doanh thu theo chiến dịch.
- Campaigns với UTM chuẩn: source, medium, campaign, content, term.
- First-touch và last-touch attribution; lưu lịch sử.
- Hàng đợi hành động: lead chưa gọi, báo giá chưa theo dõi, khách hàng cũ cần chăm sóc.

## Module B — SEO & Website Intelligence
- Google Search Console API: truy vấn, click, impressions, CTR, vị trí theo trang/query/device/country.
- PageSpeed Insights API: hiệu năng trang và cơ hội tối ưu.
- Sitemap/indexing checklist, canonical/meta, internal links, schema markup và trang sản phẩm theo model/công suất/ứng dụng.
- Hàng đợi nội dung: máy cắt laser 3kW, cắt inox 1mm, thấu kính bảo vệ Raytools BM111, lỗi Cut Head Collision, phụ tùng và bảo trì tại Việt Nam.
- Không bịa search volume nếu không có nguồn dữ liệu được cấp phép.

## Module C — Content Studio
- Thư viện chủ đề: máy CNC fiber laser, chấn CNC, hàn laser, máy tạo nitơ, vật tư tiêu hao, chẩn đoán và bảo trì.
- Tạo bản nháp bài SEO, Facebook, kịch bản TikTok/Reels, YouTube outline, Zalo OA message và email; mỗi bản có nguồn kỹ thuật, CTA, người duyệt, ngày đăng, trạng thái.
- Tái sử dụng một bài kỹ thuật thành nhiều định dạng, tránh đăng lặp nguyên văn.
- Xuất bản qua API chính thức sau khi tài khoản, quyền OAuth và review được cấp.

## Module D — Lead Capture & Qualification
- Website forms/landing pages có UTM, sản phẩm quan tâm, công suất, vật liệu, độ dày, tỉnh/thành, thời điểm dự kiến mua và consent.
- Chấm điểm minh bạch theo nhu cầu, thời gian mua, phù hợp sản phẩm và tương tác; không suy luận thuộc tính nhạy cảm.
- Gộp trùng email/điện thoại đã chuẩn hóa; giữ lịch sử nguồn và chống spam.
- Tạo lead vào CRM bằng API có idempotency; phân công theo khu vực/sản phẩm/công suất và SLA phản hồi.
- Dùng nguồn danh bạ doanh nghiệp hợp pháp, có điều khoản cho phép sử dụng thương mại.

## Module E — Nurture & Follow-up
- Chuỗi chăm sóc theo hành vi và sự đồng ý: tải catalogue, hỏi giá, nhận báo giá, bảo trì, mua phụ tùng, khách hàng cũ.
- Resend Free hiện công bố 3.000 email/tháng và 100 email/ngày; phải xác minh lại khi cấu hình. Không dùng email transactional làm đường vòng gửi quảng cáo hàng loạt.
- Telegram Bot API cho cảnh báo nội bộ: lead mới, lead nóng, lỗi tích hợp, quota gần hết, báo giá quá hạn.
- Zalo OA API chỉ dùng qua OA, token và quyền chính thức; không giả lập người dùng hoặc gửi không có sự cho phép.
- Bắt buộc unsubscribe/opt-out, suppression list, giới hạn tần suất và nhật ký gửi.

## Module F — Social & Video Intelligence
- YouTube Data API để nghiên cứu video/kênh công khai và quản lý nội dung thuộc kênh đã cấp quyền. Google hiện nêu quota mặc định 10.000 units/ngày, với quota riêng cho search.list; phải kiểm tra console trước khi chạy.
- Meta Graph API/Instagram API chỉ dùng quyền được cấp và qua app review khi cần.
- Không dùng API không rõ nguồn, scraping trái điều khoản hoặc dịch vụ yêu cầu mật khẩu mạng xã hội.

## Ma trận API khởi đầu

| Ưu tiên | API | Điều kiện/chi phí | Giá trị |
|---|---|---|---|
| P0 | Google Search Console | OAuth, xác minh property, quota theo dịch vụ | Từ khóa thực tế, click, CTR, trang SEO yếu |
| P0 | PageSpeed Insights | Quota/key theo cấu hình | Ưu tiên sửa tốc độ website |
| P0 | Telegram Bot API | Tạo bot, bảo vệ token | Cảnh báo nội bộ |
| P1 | YouTube Data API | Google Cloud project, quota giới hạn | Nghiên cứu và đo nội dung được phép |
| P1 | Resend | Free hiện công bố 3.000/tháng, 100/ngày; xác minh domain | Email giao dịch/nhắc việc |
| P1 | Google Analytics Data API | OAuth, property và quota | Hành vi web, landing page, conversion |
| P2 | Meta Graph API / Instagram | OAuth, quyền và có thể cần App Review | Xuất bản/đo nội dung thuộc tài khoản được cấp |
| P2 | Zalo OA API | OA, token, quyền và chính sách Zalo | Chăm sóc khách hàng tại Việt Nam |
| P2 | Google Business Profile API | Quyền sở hữu/ủy quyền và điều kiện API | Hiện diện địa phương khi đủ quyền |

Quota, điều khoản thương mại và free tier có thể thay đổi. Mỗi provider phải có hồ sơ gồm docs URL, ngày kiểm tra, quota, điều khoản, scopes, hạn token và cách ngắt kết nối.

## Data model đề xuất
- marketing_campaigns: tên, mục tiêu, kênh, UTM, trạng thái, owner, ngày bắt đầu/kết thúc.
- content_items: loại, chủ đề, bản nháp, nguồn, trạng thái duyệt, publisher, lịch đăng.
- lead_sources: lead, source/medium/campaign/content/term, landing page, thời điểm.
- consent_records: lead, mục đích, trạng thái, nguồn, thời điểm, phiên bản chính sách, thời điểm thu hồi.
- message_events: provider, template, trạng thái gửi/nhận/bounce/click và provider event id; không lưu token.
- provider_connections: provider, account identity, scopes, trạng thái, metadata hết hạn; secret chỉ ở secret store.
- api_usage_daily: provider, endpoint, ngày, số request, quota ước tính, lỗi.
- conversion_events: lead, báo giá, đơn hàng, doanh thu, thời điểm, attribution.
- API phải kiểm tra quyền phía server; thêm company scope nếu sau này hỗ trợ nhiều pháp nhân.

## KPI và nghiệm thu
1. 100% lead mới có nguồn và timestamp; đo tỷ lệ trùng.
2. Đo thời gian từ lúc lead vào CRM đến lần liên hệ đầu.
3. Đo lead → đủ điều kiện → báo giá → đơn hàng → doanh thu.
4. Mọi email marketing có bằng chứng đồng ý và opt-out.
5. Không lộ secret ở frontend, source map, log hoặc Git.
6. API có timeout, retry/backoff, idempotency và quota guard.
7. Mọi thay đổi DB có migration reviewable, backup và rollback.
8. CI chạy typecheck, lint, build và test route mới.
9. Không triển khai production trước khi staging đạt kiểm thử và có rollback.

## Lộ trình
### Phase 0 — Xác định nguồn chuẩn
Xác định commit tạo frontend CRM và Worker đang chạy; chọn database chuẩn; đối chiếu schema, backup, migrations, auth; ghi nhận baseline và rollback.

### Phase 1 — Growth foundation
Marketing Command Center, campaign/UTM, content calendar, lead capture, consent records, API usage ledger; tích hợp Search Console, PageSpeed và Telegram trên staging.

### Phase 2 — Content & nurture
Content Studio có duyệt thủ công, lịch đăng và thư viện CTA; email giao dịch/nhắc việc có opt-out; đồng bộ lead bằng API idempotent.

### Phase 3 — Social & sales intelligence
YouTube, Meta, Zalo OA và Google Analytics theo quyền được cấp; attribution tới báo giá/đơn hàng, SLA và cảnh báo cơ hội bỏ lỡ.

### Phase 4 — AI optimization
Gợi ý nội dung dựa trên dữ liệu Search Console/CRM; A/B test có kiểm soát; ưu tiên chuyển đổi thực tế thay vì lượt tương tác đơn thuần. Mọi hành động bên ngoài cần quyền, audit log và công tắc dừng.

## Tài liệu chính thức
- Google Search Console API: https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- YouTube Data API: https://developers.google.com/youtube/v3/getting-started
- Resend pricing: https://resend.com/pricing
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/

## Trạng thái
Tài liệu thiết kế trên nhánh riêng, chưa phải tính năng đã triển khai. Chưa tạo API key, kết nối tài khoản mạng xã hội, thay đổi dữ liệu production hay triển khai phiên bản mới.
