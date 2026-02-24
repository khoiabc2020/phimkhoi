Scripts Windows (chạy từ thư mục gốc dự án hoặc từ scripts/windows)

- sync_vps.bat      : Git add/commit/push + SSH lên VPS, chạy deploy_vps.sh (đồng bộ web).
- build_apk.bat     : Build APK local bằng Gradle (cần Android SDK).
- build_cloud.bat   : Build APK qua EAS (Expo), không cần SDK.
- auto_deploy_everything.bat : Push + deploy VPS + build APK local (tự động toàn bộ).

Lưu ý: sync_vps.bat dùng PEM và host trong file; sửa biến PEM/HOST nếu đổi server.
