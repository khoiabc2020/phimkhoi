# VPS – Tối ưu cho lượng xem lớn

## Cache đã cấu hình

- **Trang chủ (getHomeData):** cache in-memory 20 phút trên server → giảm gọi API PhimAPI/NguonC khi traffic cao.
- **Next.js page:** `revalidate = 3600` (1h) cho trang chủ.
- **Continue-watching (web):** `Cache-Control: private, max-age=20, stale-while-revalidate=30` → giảm hit DB, đồng bộ vẫn nhanh.
- **Lịch sử mobile (GET list):** `private, max-age=15, stale-while-revalidate=20`.
- **Lịch sử mobile (GET theo tập):** `private, max-age=10`.

## Database (MongoDB)

- **WatchHistory:** index `(userId, movieId, episodeSlug)` unique; `(userId, lastWatched -1)`; `(userId, movieSlug, episodeSlug)` cho mobile → query nhanh khi nhiều user.

## Chạy production

- Dùng **PM2**: `pm2 start npm --name "phimkhoi" -- start` (hoặc `node .next/standalone/server.js` nếu build standalone).
- Set **NODE_OPTIONS**: `NODE_OPTIONS=--max-old-space-size=2048` nếu RAM đủ.
- **MongoDB:** đảm bảo kết nối từ VPS tới Atlas/DB có connection pooling (mặc định mongoose đã quản lý).

## Đề mục trang chủ

- **Cấu hình:** `src/services/api.ts` — `HOME_CATEGORIES` (slug + endpoint) và `HOME_SECTION_SLUGS` (link "Xem tất cả"). Trang chủ dùng chung để đảm bảo đề mục và API chính xác.
- **NguonC:** item từ NguonC được chuẩn hóa qua `normalizeNguoncItem()` sang đúng kiểu Movie (category, country, type, …) để card và link hoạt động đầy đủ.
- **Timeout:** Mỗi request lấy danh sách trang chủ có timeout 12s để API ngoài chậm không treo VPS.
