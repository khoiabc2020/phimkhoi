# PhimKhoi

Dự án xem phim: Web (Next.js) + App mobile (Expo/React Native). Dùng để học tập đầy đủ.

## Cấu trúc dự án

```
phimkhoi/
├── src/                    # Web Next.js (App Router)
│   ├── app/                # Routes, API, actions
│   ├── components/         # Component dùng chung web
│   ├── lib/                # DB, utils
│   ├── models/             # Mongoose models
│   └── services/           # API, TMDB
├── mobile/                 # App Expo (React Native)
│   ├── app/                # Expo Router (tabs, stack)
│   ├── components/         # Component mobile
│   ├── context/            # Auth, MiniPlayer
│   └── services/           # API gọi backend
├── public/                 # Static web + APK
├── scripts/                # Cron (daily-sync), deploy hỗ trợ
│   ├── windows/            # Script tiện cho Windows (deploy VPS, build APK)
│   └── vps/                # Cấu hình Nginx + hướng dẫn domain
├── deploy_vps.sh           # Deploy lên VPS (git pull, build, PM2)
├── ecosystem.config.cjs    # PM2 chạy Next.js standalone
├── .eslintrc.cjs           # ESLint cấu hình (Next.js core-web-vitals)
└── .rules/clean-code.mdc   # Quy tắc clean code dùng chung
```

## Chạy local

**Web**

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Cần `.env.local` (MongoDB, NextAuth, v.v.).

**Mobile**

```bash
cd mobile
npm install
npx expo start
```

Build APK: xem `mobile/README.md` (EAS hoặc local Gradle).

## Deploy VPS (web)

1. SSH vào server, clone repo vào thư mục (mặc định script dùng `/home/bitnami/phimkhoi`).
2. Cấu hình `.env.local` (giống local, có `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `TMDB_API_KEY`, ...).
3. Lần đầu trên VPS có thể chạy trực tiếp:

```bash
bash deploy_vps.sh
```

Hoặc trên Windows dùng script đã cấu hình sẵn SSH key + host:

```bat
scripts\windows\sync_vps.bat "deploy: any message"
```

Script này sẽ:

- Tự `git add / commit / push` (nếu có thay đổi).
- SSH vào VPS (`bitnami@13.212.99.28`, thư mục `/home/bitnami/phimkhoi` – chỉnh trong file nếu đổi server).
- Chạy `bash deploy_vps.sh` (npm install + build + PM2 reload).

PM2 đọc cấu hình từ `ecosystem.config.cjs` và chạy app từ `.next/standalone`.

## Domain & HTTPS

- File `scripts/vps/nginx-phimkhoi.conf`: virtual host cho `khoiphim.io.vn` (và alias).
- File `scripts/vps/README-domain.md`: chi tiết:
  - Cách tạo bản ghi A (`@` và `www` → `18.141.25.244`) trên ZoneDNS.
  - Cách áp dụng cấu hình Nginx từ Windows:

    ```bat
    scripts\windows\setup_domain_vps.bat
    ```

  - Cách cài SSL với certbot:

    ```bash
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d khoiphim.io.vn -d www.khoiphim.io.vn
    ```

Xem thêm chi tiết hoặc lỗi DNS/HTTPS trong `scripts/vps/README-domain.md`.

## Học tập

- **Web**: Next.js App Router, Server Actions, API routes, NextAuth, Mongoose, Tailwind.
- **Mobile**: Expo Router, expo-av, context (auth, mini player), đồng bộ lịch sử xem với web qua API.
- **Chung**: API backend (OPhim/KKPhim), HLS proxy, lưu lịch sử xem, tiếp tục xem đồng bộ.

Xem tài liệu học & tư duy chi tiết tại `LEARNING.md`.
