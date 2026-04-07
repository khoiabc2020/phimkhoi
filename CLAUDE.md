# PhimKhoi — Claude Project Context

## Thông tin dự án
- **Tên**: KhôiPhim (phimkhoi.site)
- **Stack**: Next.js 15 (App Router) + MongoDB + NextAuth + Tailwind v4
- **Repo**: https://github.com/khoiabc2020/phimkhoi.git

## VPS / Deploy
| Thông số | Giá trị |
|---|---|
| **IP VPS** | `13.250.33.6` |
| **User** | `bitnami` |
| **SSH Key** | `C:/Users/LE HUY KHOI/Downloads/khoiphim.pem` |
| **App Dir** | `/home/bitnami/phimkhoi` |
| **Domain** | `https://khoiphim.site` |
| **Process Manager** | PM2 (`phimkhoi`) |

### Lệnh deploy chuẩn (từ máy local — Git Bash):
```bash
bash deploy_local.sh
```

### Hoặc thủ công:
```bash
git push origin main && ssh -i "C:/Users/LE HUY KHOI/Downloads/khoiphim.pem" -o StrictHostKeyChecking=no bitnami@13.250.33.6 "cd /home/bitnami/phimkhoi && git pull origin main && bash deploy_vps.sh"
```

### Chỉ SSH vào VPS (không deploy):
```bash
ssh -i "C:/Users/LE HUY KHOI/Downloads/khoiphim.pem" -o StrictHostKeyChecking=no bitnami@13.250.33.6
```

### Kiểm tra logs PM2 trên VPS:
```bash
pm2 logs phimkhoi --lines 50
pm2 status
```

## Cấu trúc chính
```
src/
  app/              # Next.js App Router pages
  components/       # React components
    BottomNav.tsx   # Mobile bottom navigation (lg:hidden)
    ProfileTabs.tsx # Trang tài khoản
    VideoPlayer.tsx # ArtPlayer wrapper
    HeroSection.tsx # Hero với auto-slide
  lib/
    utils.ts        # getImageUrl, decodeHtml (NFC normalize)
  imageLoader.ts    # Proxy ảnh qua /api/img-proxy (self-hosted)
```

## Lưu ý kỹ thuật quan trọng
- **Image proxy**: Dùng `/api/img-proxy` (sharp + disk cache), KHÔNG dùng wsrv.nl
- **Font**: `Be Vietnam Pro` (display) + `Lexend` (body) — biến CSS trong globals.css phải hardcode tên font, KHÔNG dùng `var(--font-*)` tự tham chiếu (circular reference → Times New Roman fallback)
- **Subtitle "off"**: localStorage key `subtitleLang` dùng string `"off"` (không dùng `""` — empty string là falsy)
- **Vietnamese text từ API**: Gọi `.normalize("NFC")` sau `decodeHtml()` để fix NFD encoding
- **Mobile bottom bar**: `pb-20` trên `<body>` để tránh bị che bởi BottomNav
- **iPhone notch**: BottomNav dùng `env(safe-area-inset-bottom)` padding

## Màu sắc thương hiệu
- Primary/Accent: `#8FA7C5` (xanh xám)
- Background: `#080b12`
- Card: `#0a0a0c` hoặc `bg-white/[0.025]`
