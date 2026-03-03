import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        version: "1.0.4",
        build: 5,
        force_update: false,
        download_url: "https://khoiphim.io.vn/downloads/PhimKhoi-Release.apk",
        change_log: "- Fix double-tap tua phim: không còn giật (seek ngay lập tức)\n- Brightness slider mượt 60fps\n- Badge trạng thái phim: Hoàn Tất (xanh) vs Đang chiếu (vàng)\n- Tab Tài khoản gọn hơn, thêm kiểm tra phiên bản\n- HeroSection mobile compact hơn"
    });
}
