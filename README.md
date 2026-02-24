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
├── deploy_vps.sh           # Deploy lên VPS (git pull, build, PM2)
├── ecosystem.config.cjs   # PM2 chạy Next.js standalone
└── VPS                     # Ghi chú SSH / deploy
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

## Deploy VPS

1. SSH vào server, clone repo vào thư mục (ví dụ `/home/ubuntu/phimkhoi`).
2. Cấu hình `.env.local` (giống local).
3. Chạy: `bash deploy_vps.sh` (sẽ `git pull`, `npm run build`, copy standalone + static, PM2 reload).

PM2 chạy từ `.next/standalone` với `ecosystem.config.cjs`.

## Học tập

- **Web**: Next.js App Router, Server Actions, API routes, NextAuth, Mongoose, Tailwind.
- **Mobile**: Expo Router, expo-av, context (auth, mini player), đồng bộ lịch sử xem với web qua API.
- **Chung**: API backend (OPhim/KKPhim), HLS proxy, lưu lịch sử xem, tiếp tục xem đồng bộ.

Xem tài liệu học & tư duy chi tiết tại `LEARNING.md`.
