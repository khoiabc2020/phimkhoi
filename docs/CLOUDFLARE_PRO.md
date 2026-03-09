# Hướng dẫn tối ưu Cloudflare Pro cho KhoiPhim

Sau khi mua gói **Cloudflare Pro**, bạn có thể bật các tính năng sau để trang web nhanh hơn, ổn định hơn và an toàn hơn.

---

## 1. Caching (Cache Rules) — Ưu tiên cao

**Vào:** Dashboard Cloudflare → chọn domain → **Caching** → **Cache Rules** (hoặc **Configuration**).

### Tạo Cache Rules phù hợp Next.js

| Thứ tự | Tên rule | Khi nào áp dụng | Hành động |
|--------|----------|------------------|------------|
| 1 | Cache Static Forever | URI Path starts with `/_next/static` | Cache eligibility: Eligible for cache. Edge TTL: Override → 1 year. Browser TTL: 1 year. |
| 2 | Cache Images | URI Path matches `\.(jpg|jpeg|png|gif|webp|avif)$` OR hostname equals `img.ophim.live` / `image.tmdb.org` (nếu bạn proxy ảnh qua CF) | Edge TTL: 1 month. Browser TTL: 1 week. |
| 3 | Cache API Short | URI Path starts with `/api/` | Edge TTL: Override → 1 minute (hoặc 5 phút cho `/api/mobile/home`). Browser TTL: 1 minute. (API động thì cache ngắn.) |
| 4 | Bypass API Auth | URI Path starts with `/api/user` hoặc `/api/auth` | Bypass cache (không cache). |
| 5 | Cache HTML Short | URI Path is `/` hoặc không có extension và không match `/api/` | Edge TTL: 2–5 phút. Browser TTL: 0 (hoặc 1 phút). Để Next.js revalidate hoạt động đúng. |

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
