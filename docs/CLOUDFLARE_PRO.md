# Hướng dẫn tối ưu Cloudflare Pro cho KhoiPhim

Sau khi mua gói **Cloudflare Pro**, bạn có thể bật các tính năng sau để trang web nhanh hơn, ổn định hơn và an toàn hơn.

---

## 1. Caching (Cache Rules) — Ưu tiên cao

**Vào:** Dashboard Cloudflare → chọn domain → **Caching** → **Cache Rules** (hoặc **Configuration**).

### Tạo Cache Rules phù hợp Next.js

| # | Tên rule | **When (expression trong Cloudflare)** | **Then (bạn set trong rule)** |
|---|----------|--------------------------------------|------------------------------|
| 1 | Cache Next static (1 năm) | `starts_with(http.request.uri.path, "/_next/static/")` | **Cache eligibility**: Eligible for cache  \n**Edge TTL**: Override → **1 year**  \n**Browser TTL**: Override → **1 year** |
| 2 | Cache assets/ảnh (30 ngày) | `(http.request.uri.path wildcard "*.css") or (http.request.uri.path wildcard "*.js") or (http.request.uri.path wildcard "*.mjs") or (http.request.uri.path wildcard "*.map") or (http.request.uri.path wildcard "*.woff2") or (http.request.uri.path wildcard "*.woff") or (http.request.uri.path wildcard "*.ttf") or (http.request.uri.path wildcard "*.eot") or (http.request.uri.path wildcard "*.png") or (http.request.uri.path wildcard "*.jpg") or (http.request.uri.path wildcard "*.jpeg") or (http.request.uri.path wildcard "*.gif") or (http.request.uri.path wildcard "*.webp") or (http.request.uri.path wildcard "*.avif") or (http.request.uri.path wildcard "*.svg") or (http.request.uri.path wildcard "*.ico")` | **Cache eligibility**: Eligible for cache  \n**Edge TTL**: Override → **30 days**  \n**Browser TTL**: Override → **7 days** |
| 3 | Cache API public (1 giờ) | `http.request.uri.path in {"/api/mobile/home" "/api/mobile/hero-trending"}` | **Cache eligibility**: Eligible for cache  \n**Edge TTL**: Override → **1 hour**  \n**Browser TTL**: Override → **60 seconds** |
| 6 | Cache ảnh proxy (4 giờ) | `starts_with(http.request.uri.path, "/api/img-proxy")` | **Cache eligibility**: Eligible for cache  \n**Edge TTL**: Override → **4 hours**  \n**Browser TTL**: Respect existing headers (hoặc Override 1h) |
| 4 | Bypass API đăng nhập/user | `starts_with(http.request.uri.path, "/api/auth") or starts_with(http.request.uri.path, "/api/user")` | **Cache eligibility**: **Bypass cache** |
| 5 | HTML (khuyến nghị an toàn) | `(http.request.method eq "GET") and not starts_with(http.request.uri.path, "/api/") and not starts_with(http.request.uri.path, "/_next/") and not ((http.request.uri.path wildcard "*.css") or (http.request.uri.path wildcard "*.js") or (http.request.uri.path wildcard "*.mjs") or (http.request.uri.path wildcard "*.map") or (http.request.uri.path wildcard "*.woff2") or (http.request.uri.path wildcard "*.woff") or (http.request.uri.path wildcard "*.ttf") or (http.request.uri.path wildcard "*.eot") or (http.request.uri.path wildcard "*.png") or (http.request.uri.path wildcard "*.jpg") or (http.request.uri.path wildcard "*.jpeg") or (http.request.uri.path wildcard "*.gif") or (http.request.uri.path wildcard "*.webp") or (http.request.uri.path wildcard "*.avif") or (http.request.uri.path wildcard "*.svg") or (http.request.uri.path wildcard "*.ico"))` | **Khuyến nghị**: để mặc định (không ép “Cache Everything”), tránh cache nhầm HTML có cá nhân hoá. Nếu bạn muốn cache HTML ở edge thì chỉ nên dùng **Edge TTL ≥ 1 hour** và cần quy trình **Purge cache khi deploy**. |

**Lưu ý quan trọng (Cloudflare Pro):** nếu bạn dùng **Edge TTL Override** trong rule, Cloudflare Pro có **Minimum Edge Cache TTL = 1 hour**. Vì vậy các rule “cache ngắn vài phút” ở edge là **không áp dụng được** trên Pro (trừ khi bạn không override và để origin tự control).

**Lưu ý quan trọng (Cloudflare Pro):** biểu thức Rules Language dùng `starts_with()`/`ends_with()` dưới dạng **hàm**. Ví dụ đúng: `starts_with(http.request.uri.path, "/_next/static/")` (không viết kiểu `http.request.uri.path starts_with ...`).

**Cách tạo (ví dụ rule 1):**

- **Create rule** → Tên: `Cache Static Forever`
- **When:** `(http.request.uri.path starts with "/_next/static")`
- **Then:**  
  - Set cache eligibility = Eligible for cache  
  - Edge TTL = Override → 1 year  
  - Browser TTL = 1 year  

Lưu và **Deploy**. Làm tương tự cho các rule còn lại, điều chỉnh điều kiện và TTL theo bảng.

---

## 2. Speed → Optimization

**Vào:** **Speed** → **Optimization**.

- **Auto Minify:** Bật **JavaScript**, **CSS**, **HTML**.
- **Brotli:** Bật (nén tốt hơn gzip, trình duyệt hỗ trợ rộng).
- **Early Hints:** Bật (gửi Link header sớm để trình duyệt preload tài nguyên → FCP/LCP tốt hơn).
- **Rocket Loader:** Tùy chọn. Thử bật; nếu thấy lỗi JS (menu, form, player) thì tắt.

---

## 3. Caching → Tiered Cache (Pro có sẵn)

**Vào:** **Caching** → **Tiered Cache**.

- Bật **Tiered Cache**.
- Giúp cache nhiều tầng (edge → parent), giảm số lần gọi về origin, trang chủ và API cache sẽ “ấm” hơn, ít lag hơn khi nhiều người vào.

---

## 4. Images (Polish) — nếu dùng ảnh qua Cloudflare

**Vào:** **Speed** → **Optimization** → **Image Optimization** (hoặc **Polish** tùy giao diện).

- **Polish:** Bật **Lossless** hoặc **Lossy** (lossy nhỏ file hơn, chất lượng vẫn ổn cho ảnh phim).
- **WebP / AVIF:** Bật để Cloudflare tự phục vụ ảnh WebP/AVIF cho trình duyệt hỗ trợ.

Lưu ý: Chỉ có hiệu lực với request đi qua Cloudflare. Nếu ảnh gốc từ `image.tmdb.org` hoặc `img.ophim.live` không qua proxy Cloudflare thì Polish không áp dụng; khi đó nên dùng Next.js Image Optimization hoặc proxy ảnh qua domain của bạn.

---

## 5. Argo Smart Routing (Add-on trả phí)

**Vào:** **Speed** → **Optimization** → **Routing** → **Argo Smart Routing**.

- Argo Smart Routing chọn đường đi tối ưu từ user đến origin → giảm latency, đặc biệt tốt cho VPS đặt xa user.
- Pro plan có thể mua add-on Argo (tính phí theo traffic). Nếu ngân sách cho phép, bật sẽ giúp “cảm giác” load và API đỡ trễ hơn.

---

## 6. Security cơ bản (Pro)

**Vào:** **Security** → **Settings** và **WAF**.

- **Security Level:** Đặt **Medium** hoặc **High** tùy lượng traffic và tỉ lệ bot.
- **Challenge Passage:** 30 phút thường đủ.
- **WAF (Pro):** Bật **OWASP Core Ruleset** và các rule Managed Rules phù hợp (ví dụ Cloudflare Managed Ruleset). Có thể bắt đầu với **Sensitivity: Medium** rồi chỉnh dần nếu có false positive (ví dụ block nhầm user thật).

---

## 7. Page Rules (legacy) — dùng nếu chưa chuyển hết sang Cache Rules

Nếu bạn vẫn dùng **Page Rules** (giới hạn 3 rule trên Free, Pro có thêm):

1. `*khoiphim.io.vn/_next/static/*` → Cache Level: Cache Everything, Edge TTL: 1 year.  
2. `*khoiphim.io.vn/api/*` → Cache Level: Standard (hoặc Bypass cho API có session).  
3. `*khoiphim.io.vn/*` → Cache Level: Standard, Edge TTL: 2–5 phút cho HTML.

Ưu tiên chuyển dần sang **Cache Rules** vì linh hoạt và dễ tối ưu hơn.

---

## 8. Kiểm tra sau khi bật

- **Caching** → **Configuration**: Xem **Cache Hit Rate** (nên tăng sau vài giờ).
- **Analytics** → **Traffic / Performance**: So sánh thời gian load, lượt request trước và sau khi bật Tiered Cache + Cache Rules.
- Dùng **PageSpeed Insights** hoặc **WebPageTest** để đo LCP, FCP, TTI trên desktop và mobile.

---

## Tóm tắt nhanh

| Bước | Việc cần làm |
|------|------------------|
| 1 | Tạo **Cache Rules** cho `/_next/static`, `/api/`, ảnh, HTML. |
| 2 | Bật **Auto Minify**, **Brotli**, **Early Hints** trong Speed → Optimization. |
| 3 | Bật **Tiered Cache** trong Caching. |
| 4 | Bật **Polish** (và WebP/AVIF) nếu ảnh đi qua Cloudflare. |
| 5 | (Tùy chọn) Bật **Argo Smart Routing** nếu mua add-on. |
| 6 | Bật **Security Level** và **WAF** phù hợp. |

Sau khi áp dụng, reload trang chủ và vài trang con để xem cache đã ăn chưa; thường sau 5–10 phút hit rate tăng và cuộn/load sẽ mượt hơn.
