# PhimKhoi — Learning Handbook (Web + Mobile)

Tài liệu tổng hợp **công nghệ**, **kiến trúc**, **luồng dữ liệu**, **danh sách file/API/models** và **tư duy triển khai** trong dự án `phimkhoi`, mức siêu đầy đủ để học và mở rộng.

---

## Mục lục

1. [Bức tranh tổng quan](#1-bức-tranh-tổng-quan)
2. [Tech stack chi tiết](#2-tech-stack-chi-tiết)
3. [Biến môi trường (Env)](#3-biến-môi-trường-env)
4. [Cấu trúc thư mục & file quan trọng](#4-cấu-trúc-thư-mục--file-quan-trọng)
5. [Web — Routes (Pages) & API](#5-web--routes-pages--api)
6. [Mobile — Routes (Screens) & Stack](#6-mobile--routes-screens--stack)
7. [Database — Models & Schema](#7-database--models--schema)
8. [Server Actions (Web)](#8-server-actions-web)
9. [Luồng đồng bộ "Tiếp tục xem" (Web ⇄ Mobile)](#9-luồng-đồng-bộ-tiếp-tục-xem-web--mobile)
10. [Player — Native vs WebView, UX](#10-player--native-vs-webview-ux)
11. [HLS Proxy](#11-hls-proxy)
12. [Build & Deploy](#12-build--deploy)
13. [Performance & Debug](#13-performance--debug)
14. [Mở rộng & best practices](#14-mở-rộng--best-practices)

---

## 1) Bức tranh tổng quan

- **Web**: Next.js (App Router) trong `src/` — trang chủ, chi tiết phim, xem phim, đăng nhập, admin, API.
- **Mobile**: Expo/React Native (Expo Router) trong `mobile/` — app Android: trang chủ, khám phá, xem phim, yêu thích, lịch sử, mini player (PiP in-app).

Trọng tâm:

- **Nguồn phim**: API bên ngoài (PhimAPI/KKPhim, OPhim fallback).
- **Lịch sử xem**: lưu MongoDB (WatchHistory), đồng bộ web ⇄ mobile qua API + polling.
- **Player**: HLS (expo-av / web HLS.js) hoặc embed (WebView).
- **Deploy**: Next.js standalone + PM2 trên VPS.

> Thư mục `tv/` đã xóa, không còn dùng.

---

## 2) Tech stack chi tiết

| Layer | Công nghệ | Ghi chú |
|-------|-----------|--------|
| Web framework | Next.js 16 (App Router) | `src/app/` |
| Web UI | React 19, TailwindCSS | Component trong `src/components/` |
| Web auth | NextAuth | `src/app/api/auth/[...nextauth]/route.ts` |
| Web data | Mongoose, MongoDB | `src/lib/db.ts`, `src/models/` |
| Web API phim | PhimAPI (phimapi.com), OPhim fallback | `src/services/api.ts` |
| Web TMDB | TMDB API (rating, cast, trending) | `src/services/tmdb.ts`, `src/app/actions/tmdb.ts` |
| Mobile framework | Expo ~52, React Native | `mobile/` |
| Mobile routing | expo-router | File-based: `mobile/app/**/*.tsx` |
| Mobile video | expo-av, react-native-webview | `mobile/components/NativePlayer.tsx` |
| Mobile state | React Context (Auth, MiniPlayer) | `mobile/context/` |
| Mobile storage | AsyncStorage | Token, user, favorites cache |
| Infra | PM2, Next.js standalone | `ecosystem.config.cjs`, `deploy_vps.sh` |

---

## 3) Biến môi trường (Env)

**Web (`.env.local` ở root):**

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `MONGODB_URI` | Có | Chuỗi kết nối MongoDB (Atlas hoặc local). |
| `NEXTAUTH_SECRET` | Có | Secret cho NextAuth (JWT, session). |
| `NEXTAUTH_URL` | Có (production) | URL gốc web, VD: `http://localhost:3000` hoặc `https://yourdomain.com`. |
| `TMDB_API_KEY` | Khuyến nghị | API key TMDB (rating, cast, trending). |

**Mobile:** không dùng `.env`; cấu hình trong `mobile/constants/config.ts`:

- `PHIM_API_URL`: URL API phim (VD: `https://phimapi.com`).
- `BACKEND_URL`: URL backend Next.js (VD: `http://18.141.25.244` cho VPS) — dùng cho đăng nhập, history, favorites.

---

## 4) Cấu trúc thư mục & file quan trọng

```
phimkhoi/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Trang chủ web
│   │   ├── layout.tsx                  # Layout gốc web
│   │   ├── phim/[slug]/page.tsx        # Chi tiết phim
│   │   ├── xem-phim/[slug]/page.tsx    # Redirect xem phim
│   │   ├── xem-phim/[slug]/[episode]/page.tsx  # Trang xem phim (player web)
│   │   ├── login, register, forgot-password, reset-password
│   │   ├── lich-su-xem, phim-yeu-thich, thong-tin-tai-khoan
│   │   ├── danh-sach/[type], the-loai/[slug], quoc-gia/[slug], tim-kiem
│   │   ├── admin/, admin/users, admin/comments
│   │   ├── api/                        # API routes (xem bảng bên dưới)
│   │   └── actions/                    # Server Actions (watchHistory, favorites, tmdb, ...)
│   ├── components/                     # Header, HeroSection, VideoPlayer, ContinueWatchingRow, ...
│   ├── lib/                           # db.ts (MongoDB cache), utils, cache
│   ├── models/                        # Mongoose: User, Movie, WatchHistory, Favorite, ...
│   └── services/                     # api.ts (PhimAPI), tmdb.ts
├── mobile/
│   ├── app/
│   │   ├── _layout.tsx                # Root layout (Stack, AuthProvider, MiniPlayerProvider)
│   │   ├── (tabs)/_layout.tsx         # Tab bar: Trang chủ, Khám phá, Lịch, Tải, Cá nhân
│   │   ├── (tabs)/index.tsx            # Trang chủ
│   │   ├── (tabs)/explore.tsx          # Khám phá
│   │   ├── (tabs)/favorites.tsx        # Yêu thích
│   │   ├── (tabs)/profile.tsx         # Cá nhân
│   │   ├── (auth)/login.tsx, register.tsx
│   │   ├── movie/[slug].tsx           # Chi tiết phim
│   │   ├── player/[slug].tsx          # Màn hình player (query: episode, server)
│   │   ├── list/[type].tsx            # Danh sách theo type (phim-le, phim-bo, ...)
│   │   ├── category/[slug].tsx        # Thể loại
│   │   ├── country/[slug].tsx         # Quốc gia
│   │   ├── search.tsx                 # Tìm kiếm
│   │   ├── history.tsx, watchlist.tsx
│   │   └── notifications/index.tsx, settings/index.tsx
│   ├── components/                    # NativePlayer, MovieRow, ContinueWatchingRow, HeroSection, ...
│   ├── context/                      # auth.tsx, miniplayer.tsx
│   ├── services/                     # api.ts (PhimAPI + BACKEND_URL history/favorites)
│   ├── constants/config.ts           # PHIM_API_URL, BACKEND_URL
│   └── hooks/
├── public/                           # Static: logo, APK
├── scripts/
│   ├── daily-sync.mjs                # Cron sync (trending, ...)
│   ├── setup-cron.sh                 # Cài cron trên VPS
│   └── cursor_clean_cache.bat        # Xóa cache Cursor (Windows)
├── deploy_vps.sh                     # Deploy: git pull, build, copy standalone, PM2
├── ecosystem.config.cjs              # PM2: cwd .next/standalone, script server.js
└── VPS                               # Ghi chú SSH / deploy
```

---

## 5) Web — Routes (Pages) & API

### 5.1 Trang (Pages) — đường dẫn tương ứng

| Đường dẫn | File | Mô tả |
|-----------|------|--------|
| `/` | `src/app/page.tsx` | Trang chủ (hero, các row phim). |
| `/phim/[slug]` | `src/app/phim/[slug]/page.tsx` | Chi tiết phim (TMDB, cast, nút xem). |
| `/xem-phim/[slug]` | `src/app/xem-phim/[slug]/page.tsx` | Redirect tới tập đầu hoặc tập đang xem. |
| `/xem-phim/[slug]/[episode]` | `src/app/xem-phim/[slug]/[episode]/page.tsx` | Trang xem phim (player + danh sách tập). |
| `/danh-sach/[type]` | `src/app/danh-sach/[type]/page.tsx` | Danh sách theo type: phim-le, phim-bo, hoat-hinh, tv-shows. |
| `/the-loai/[slug]` | `src/app/the-loai/[slug]/page.tsx` | Phim theo thể loại. |
| `/quoc-gia/[slug]` | `src/app/quoc-gia/[slug]/page.tsx` | Phim theo quốc gia. |
| `/tim-kiem` | `src/app/tim-kiem/page.tsx` | Tìm kiếm. |
| `/login`, `/register` | `src/app/login/page.tsx`, `register/page.tsx` | Auth. |
| `/lich-su-xem` | `src/app/lich-su-xem/page.tsx` | Lịch sử xem. |
| `/phim-yeu-thich` | `src/app/phim-yeu-thich/page.tsx` | Yêu thích. |
| `/admin`, `/admin/users`, `/admin/comments` | `src/app/admin/**` | Admin. |

### 5.2 API Routes — đầy đủ

| Method | Đường dẫn | File | Mô tả |
|--------|-----------|------|--------|
| GET | `/api/hls-proxy?url=...` | `src/app/api/hls-proxy/route.ts` | Proxy HLS (CORS, rewrite M3U8). |
| GET | `/api/user/continue-watching` | `src/app/api/user/continue-watching/route.ts` | Danh sách "Tiếp tục xem" (no-store, cho web polling). |
| GET/POST/DELETE | `/api/user/favorites` | `src/app/api/user/favorites/route.ts` | Yêu thích (web). |
| GET/POST/DELETE | `/api/user/playlists` | `src/app/api/user/playlists/route.ts`, `[id]` | Playlist. |
| GET | `/api/user/history` | (nếu có) | Lịch sử (web có thể dùng Server Action thay). |
| GET/POST | `/api/mobile/user/history` | `src/app/api/mobile/user/history/route.ts` | **Lịch sử cho app: GET danh sách, POST lưu tiến độ (Bearer token).** |
| GET/POST/DELETE | `/api/mobile/user/favorites` | `src/app/api/mobile/user/favorites/route.ts` | Yêu thích cho app (Bearer). |
| GET/POST | `/api/mobile/user/playlists` | `src/app/api/mobile/user/playlists/route.ts`, `[id]` | Playlist cho app. |
| GET/POST | `/api/mobile/user/watchlist` | `src/app/api/mobile/user/watchlist/route.ts` | Watchlist cho app. |
| POST | `/api/mobile/auth/login` | `src/app/api/mobile/auth/login/route.ts` | Đăng nhập app → trả JWT. |
| POST | `/api/mobile/auth/register` | `src/app/api/mobile/auth/register/route.ts` | Đăng ký app. |
| GET | `/api/mobile/hero-trending` | `src/app/api/mobile/hero-trending/route.ts` | Hero/trending cho app (TMDB + PhimAPI). |
| GET | `/api/mobile/version` | `src/app/api/mobile/version/route.ts` | Version app (optional). |
| GET | `/api/trending` | `src/app/api/trending/route.ts` | Trending (cache từ daily-sync). |
| GET | `/api/ratings/[slug]` | `src/app/api/ratings/[slug]/route.ts` | Rating. |
| GET/POST | `/api/comments/[slug]` | `src/app/api/comments/[slug]/route.ts` | Bình luận. |
| * | `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts` | NextAuth (session web). |
| POST | `/api/auth/register` | `src/app/api/auth/register/route.ts` | Đăng ký web. |
| POST | `/api/auth/forgot-password` | `src/app/api/auth/forgot-password/route.ts` | Quên mật khẩu. |
| POST | `/api/auth/reset-password` | `src/app/api/auth/reset-password/route.ts` | Đặt lại mật khẩu. |
| GET/POST | `/api/admin/*` | `src/app/api/admin/*` | Admin: stats, sync, users, comments. |

---

## 6) Mobile — Routes (Screens) & Stack

### 6.1 Expo Router: file → route

| Route (trong app) | File | Mô tả |
|-------------------|------|--------|
| `/(tabs)` | `(tabs)/_layout.tsx` | Tab bar (Trang chủ, Khám phá, Lịch, Tải, Cá nhân). |
| `/(tabs)` | `(tabs)/index.tsx` | Tab Trang chủ. |
| `/(tabs)/explore` | `(tabs)/explore.tsx` | Khám phá. |
| `/(tabs)/favorites` | `(tabs)/favorites.tsx` | Yêu thích. |
| `/(tabs)/profile` | `(tabs)/profile.tsx` | Cá nhân. |
| `/(auth)/login` | `(auth)/login.tsx` | Đăng nhập. |
| `/(auth)/register` | `(auth)/register.tsx` | Đăng ký. |
| `/movie/[slug]` | `movie/[slug].tsx` | Chi tiết phim. |
| `/player/[slug]` | `player/[slug].tsx` | Player (query: `?episode=...&server=0`). |
| `/list/[type]` | `list/[type].tsx` | Danh sách (phim-le, phim-bo, ...). |
| `/category/[slug]` | `category/[slug].tsx` | Thể loại. |
| `/country/[slug]` | `country/[slug].tsx` | Quốc gia. |
| `/search` | `search.tsx` | Tìm kiếm. |
| `/history` | `history.tsx` | Lịch sử xem. |
| `/watchlist` | `watchlist.tsx` | Watchlist. |
| `/notifications/index` | `notifications/index.tsx` | Thông báo. |
| `/settings/index` | `settings/index.tsx` | Cài đặt. |

**Lưu ý:** Tránh tạo file trùng tên (VD: `favorites.tsx` ở root và trong `(tabs)`) để không bị **route conflict**. Link dùng đúng path: `/(tabs)/favorites`, `/(tabs)/explore`, không dùng `/favorites` nếu màn hình nằm trong tabs.

### 6.2 Root layout (`mobile/app/_layout.tsx`)

- `GestureHandlerRootView` → `ErrorBoundary` → `AuthProvider` → `MiniPlayerProvider` → `ThemeProvider` → `Stack` (các screen trên) + `MiniPlayerOverlay`.
- Global error handler: gọi `ErrorUtils.setGlobalHandler` để log lỗi và vẫn gọi handler cũ (tránh “nuốt” fatal → app đơ).

---

## 7) Database — Models & Schema

| Model | File | Mục đích chính |
|-------|------|----------------|
| **User** | `src/models/User.ts` | Tài khoản: email, password, role, favorites[], watchlist[], history[] (legacy). |
| **Movie** | `src/models/Movie.ts` | Bản sync phim từ nguồn (slug, name, thumb_url, episodes, ...). **Quan trọng:** API `POST /api/mobile/user/history` dùng `Movie.findOne({ slug })` để lấy thông tin phim khi lưu lịch sử — cần sync Movie (admin/sync) nếu dùng lưu history từ app. |
| **WatchHistory** | `src/models/WatchHistory.ts` | **Nguồn sự thật** cho "Tiếp tục xem": userId, movieId, movieSlug, movieName, moviePoster, episodeSlug, episodeName, progress (0–100), duration, currentTime, lastWatched. Index: (userId, movieId, episodeSlug) unique; (userId, lastWatched). |
| **Favorite** | `src/models/Favorite.ts` | Yêu thích (user + movie). |
| **Watchlist** | `src/models/Watchlist.ts` | Xem sau. |
| **Playlist** | `src/models/Playlist.ts` | Playlist tùy chỉnh. |
| **Comment** | `src/models/Comment.ts` | Bình luận phim. |
| **Rating** | `src/models/Rating.ts` | Đánh giá. |
| **UserSettings** | `src/models/UserSettings.ts` | Cài đặt user. |

**WatchHistory — ví dụ aggregation "Tiếp tục xem" (1 bản ghi mới nhất mỗi phim):**

```js
WatchHistory.aggregate([
  { $match: { userId, progress: { $lt: 99 } } },
  { $sort: { lastWatched: -1 } },
  { $group: { _id: "$movieId", doc: { $first: "$$ROOT" } } },
  { $replaceRoot: { newRoot: "$doc" } },
  { $sort: { lastWatched: -1 } },
  { $limit: 10 }
])
```

---

## 8) Server Actions (Web)

| Action | File | Chức năng |
|--------|------|-----------|
| `addWatchHistory` | `src/app/actions/watchHistory.ts` | Thêm/cập nhật lịch sử xem (web). |
| `getWatchHistory`, `getContinueWatching` | Cùng file | Lấy lịch sử / tiếp tục xem. |
| `removeWatchHistory`, `clearWatchHistory` | Cùng file | Xóa 1 hoặc xóa hết. |
| `getWatchHistoryForEpisode` | Cùng file | Lấy progress theo movieId + episodeSlug (auto-resume). |
| `getTMDBDataForCard`, `getMovieCast` | `src/app/actions/tmdb.ts` | TMDB cho card/cast (Server Action). |
| Favorites, Watchlist, Comments, Settings | `src/app/actions/favorites.ts`, `watchlist.ts`, `comments.ts`, `settings.ts` | CRUD tương ứng. |

---

## 9) Luồng đồng bộ "Tiếp tục xem" (Web ⇄ Mobile)

### 9.1 Contract dữ liệu (WatchHistory)

- **Lưu:** userId, movieId, movieSlug, movieName, moviePoster, episodeSlug, episodeName, progress (0–100), duration (giây), currentTime (giây), lastWatched.
- **Hiển thị:** Lấy tối đa 1 bản ghi mới nhất mỗi phim (progress < 99), sort theo lastWatched.

### 9.2 Mobile lưu tiến độ

1. User xem trong `player/[slug].tsx`; `handleProgress` (hoặc tương đương) gọi `saveHistory(slug, episodeSlug, currentTime, duration, token)`.
2. `mobile/services/api.ts` → `saveHistory` gửi `POST /api/mobile/user/history` (BACKEND_URL) với body: `{ slug, episode, movieSlug, episodeSlug, progress: time, duration }`, header `Authorization: Bearer <token>`.
3. API `src/app/api/mobile/user/history/route.ts` (POST): verify JWT → `Movie.findOne({ slug })` (cần Movie có trong DB) → tính % progress → `WatchHistory.findOneAndUpdate` (upsert theo userId, movieId, episodeSlug).

### 9.3 Web hiển thị "Tiếp tục xem"

1. Component `src/components/ContinueWatchingRow.tsx`: client fetch `GET /api/user/continue-watching` (Cache-Control: no-store).
2. Polling: mỗi 10s gọi lại; khi tab active (`visibilitychange`) cũng gọi lại → sau khi mobile lưu vài giây, web cập nhật.

### 9.4 Mobile hiển thị "Tiếp tục xem"

- Lấy từ `getHistory(token)` → GET `/api/mobile/user/history` (Bearer). API trả về đã format (slug, episode, progress, movieName, moviePoster, ...).

---

## 10) Player — Native vs WebView, UX

### 10.1 Phân nhánh nguồn phát

- **HLS (link_m3u8, không phải YouTube):** dùng **expo-av** (NativePlayer) — ổn định, có control.
- **Embed / YouTube / khác:** dùng **WebView** (trong cùng màn player).

### 10.2 Đổi server / đổi tập không reload màn hình

- Trong `mobile/app/player/[slug].tsx`: dùng một hàm `applyEpisode(data, serverIndex, episodeSlug)` cập nhật state (videoUrl, episodeTitle, nextEpisodeSlug, isNative/WebView). Khi user chọn server khác hoặc tập khác → gọi `applyEpisode` thay vì `router.replace` → không reload full màn, không nháy đen.

### 10.3 Auto next tập

- Trong NativePlayer: khi `status.didJustFinish === true` và có `onNext()` → gọi `onNext()` một lần (guard để không gọi liên tục). Parent (player/[slug].tsx) dùng `nextEpisodeSlug` để gọi `applyEpisode` cho tập tiếp theo.

### 10.4 Loading overlay

- Chỉ hiển thị khi **chưa load xong** (`!status.isLoaded`), không hiển thị khi đang buffering/seek ngắn → tránh spinner nhấp nháy mỗi lần seek.

### 10.5 Mini Player (PiP in-app)

- Context `MiniPlayerProvider` + component `MiniPlayerOverlay`: khi user bấm PiP trong player → `openMini({ url, title, episode })` + có thể `router.back()`. Overlay phát tiếp bằng `<Video>` (expo-av), có nút thu nhỏ/phóng to và đóng.

---

## 11) HLS Proxy

- **File:** `src/app/api/hls-proxy/route.ts`.
- **Vấn đề:** CORS / Referer chặn; M3U8 chứa URL tương đối, client không fetch được.
- **Cách làm:**
  - GET với query `url=...` (URL gốc segment hoặc playlist).
  - Request upstream với Referer/Origin = origin của URL video.
  - Nếu **không phải M3U8** (segment .ts hoặc binary): trả `response.body` stream thẳng.
  - Nếu **M3U8**: đọc body, từng dòng không phải comment → đổi thành URL tuyệt đối rồi wrap: `/api/hls-proxy?url=<absoluteUrl>`, trả text playlist.

---

## 12) Build & Deploy

### 12.1 Web (VPS)

- **Script:** `deploy_vps.sh`: vào thư mục app → `git pull` → `npm install` → `rm -rf .next` → `export NODE_OPTIONS="--max_old_space_size=2048"` → `npm run build` → copy `public` và `.next/static` vào `.next/standalone` → copy `.env.local` nếu có → `pm2 startOrReload ecosystem.config.cjs`.
- **PM2:** `ecosystem.config.cjs`: `cwd: ".next/standalone"`, `script: "server.js"`, port 3000. **Quan trọng:** phải chạy từ `standalone` thì static (CSS/JS) mới phục vụ đúng.

### 12.2 Mobile APK

- Xem `mobile/README.md`: EAS Build (khuyên dùng), hoặc local `npx expo prebuild` + Gradle `assembleRelease`. APK copy về có thể đặt trong `public/app-mobile-release.apk` để tải từ web.

---

## 13) Performance & Debug

### 13.1 Performance

- **Web:** Giảm render nặng khi scroll (hero/carousel); giảm shadow/blur trên mobile web; TMDB chỉ fetch khi desktop (hero) để giảm CPU mobile.
- **Mobile:** Tránh setState progress quá dày; không reload route khi đổi server/tập; loading overlay chỉ khi chưa load, không khi buffer ngắn.
- **Continue watching:** Web dùng API + polling (no-store), không phụ thuộc cache Server Action cho dữ liệu “realtime”.

### 13.2 Debug thường gặp

| Triệu chứng | Kiểm tra |
|-------------|----------|
| Crash khi bấm (mobile) | Route conflict (file trùng tên); href sai (dùng `/(tabs)/...`); null/undefined (movie.episode_current, v.v.). |
| App đơ, không phản hồi | Global error handler có gọi lại handler cũ với fatal không. |
| Web 500 cho static (CSS/JS) | PM2 `cwd` có đúng `.next/standalone` không; đã copy `public` và `.next/static` vào standalone chưa. |
| Tiếp tục xem không sync | API route có `Cache-Control: no-store`; web có polling + visibilitychange; mobile có gọi `saveHistory` với token. |
| Lưu history từ app báo lỗi | Movie có tồn tại trong DB với `slug` tương ứng không (cần sync Movie). |

---

## 14) Mở rộng & best practices

- **Contract dữ liệu:** Chuẩn hóa type (VD `src/types/`) cho WatchHistory, Movie, API response để web và mobile dùng chung.
- **Service layer:** Tách rõ: movie (PhimAPI), history (WatchHistory + API), tmdb, auth.
- **Logging:** Log lỗi có context (user id, slug, endpoint), tránh log spam; production có thể chỉ log warn/error.
- **Realtime nâng cao:** Khi cần, thay polling bằng WebSocket hoặc SSE từ server để push cập nhật "Tiếp tục xem".
- **Bảo mật:** Không commit `.env.local`; TMDB key có thể để env phía server, app chỉ gọi API backend; JWT verify dùng `NEXTAUTH_SECRET` thống nhất.

---

*Tài liệu này đi kèm dự án để học kiến trúc, luồng dữ liệu và vận hành; cập nhật khi thêm route/model hoặc đổi luồng quan trọng.*
