import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        version: "1.0.6",
        build: 7,
        force_update: false,
        download_url: "https://khoiphim.io.vn/downloads/PhimKhoi-Release.apk",
        change_log: "- Tối ưu giao diện xem phim trên máy tính bảng (Tablet)\n- Tính năng tự động cập nhật và kiểm tra phiên bản mới\n- Sửa lỗi UI Hero Section bị đem\n- Tăng cường trải nghiệm người dùng"
    });
}
