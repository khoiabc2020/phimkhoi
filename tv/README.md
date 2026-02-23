# PhimKhoi Mobile - App Android

Ứng dụng xem phim React Native (Expo) cho Android.

## Tính năng

- **Trang chủ**: Hero carousel, Phim lẻ, Phim bộ, Hoạt hình, TV Shows
- **Khám phá**: Tìm kiếm phim, danh mục (Phim lẻ, Phim bộ...), Thể loại, Quốc gia
- **Yêu thích**: Lưu phim yêu thích (AsyncStorage)
- **Chi tiết phim**: Thông tin, danh sách tập, nút xem phim
- **Xem phim**: WebView fullscreen, tự xoay ngang
- **Cá nhân**: Liên kết phiên bản web

## Tạo file APK (3 cách)

### Cách 1: EAS Build (Khuyên dùng - không cần cài Android SDK)

```bash
cd mobile
npm install
npx eas-cli login          # Đăng nhập Expo (tạo tài khoản miễn phí)
npm run build:android
```

Sau 10–15 phút, APK sẽ có tại [expo.dev](https://expo.dev) → dự án → Builds → tải về.

### Cách 2: Chạy script

```bash
cd mobile/scripts
build-apk.bat              # Windows
# hoặc
./build-apk.sh             # Mac/Linux
```

### Cách 3: GitHub Actions (tự động)

1. Tạo token: [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)
2. Thêm secret `EXPO_TOKEN` vào GitHub repo: Settings → Secrets → Actions
3. Push code → Workflow chạy → APK tạo trên Expo cloud

## Chạy development

```bash
cd mobile
npm install
npm start
# Nhấn 'a' để mở Android emulator
```

## Build local (cần Android SDK)

```bash
cd mobile
# Cài Android Studio và set ANDROID_HOME
npx expo prebuild --platform android
cd android
gradlew.bat assembleRelease    # Windows
# APK: android/app/build/outputs/apk/release/app-release.apk
```

## Cấu hình

- API: Sửa `constants/config.ts` nếu cần đổi PhimAPI URL
- Phiên bản web: Sửa URL trong `app/(tabs)/profile.tsx`
