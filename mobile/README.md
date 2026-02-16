# PhimKhoi Mobile - App Android

Ứng dụng xem phim React Native (Expo) cho Android.

## Tính năng

- **Trang chủ**: Hero carousel, Phim lẻ, Phim bộ, Hoạt hình, TV Shows
- **Khám phá**: Tìm kiếm phim, danh mục (Phim lẻ, Phim bộ...), Thể loại, Quốc gia
- **Yêu thích**: Lưu phim yêu thích (AsyncStorage)
- **Chi tiết phim**: Thông tin, danh sách tập, nút xem phim
- **Xem phim**: WebView fullscreen, tự xoay ngang
- **Cá nhân**: Liên kết phiên bản web

## Chạy development

```bash
cd mobile
npm install
npm start
# Nhấn 'a' để mở Android emulator
```

## Build APK (EAS Build)

1. Cài EAS CLI: `npm i -g eas-cli`
2. Đăng nhập: `eas login`
3. Build: `npm run build:android`

APK sẽ được tải từ Expo dashboard sau khi build xong.

## Build local (Android)

```bash
cd mobile
npx expo prebuild
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

## Cấu hình

- API: Sửa `constants/config.ts` nếu cần đổi PhimAPI URL
- Phiên bản web: Sửa URL trong `app/(tabs)/profile.tsx`
