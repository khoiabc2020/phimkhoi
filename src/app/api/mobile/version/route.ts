import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        version: "1.0.2",
        build: 3,
        force_update: false,
        download_url: "https://khoiphim.io.vn/downloads/PhimKhoi-Release.apk",
        change_log: "- Tối ưu tải ảnh qua VPS proxy (không còn đen màn hình khi cuộn)\n- Cải thiện màn hình tìm kiếm với bộ lọc\n- Fix HeroSection swipe mượt hơn\n- Thêm thông báo cập nhật trong App"
    });
}
