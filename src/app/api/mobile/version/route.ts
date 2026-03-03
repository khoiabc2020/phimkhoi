import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        version: "1.0.5",
        build: 6,
        force_update: false,
        download_url: "https://khoiphim.io.vn/downloads/PhimKhoi-Release.apk",
        change_log: "- Tích hợp thẻ Cập nhật tự động vào tab Thông báo\n- Sửa lỗi UI Hero Section bị đen chữ\n- Fix chiều cao TabBar (iOS)\n- Tối ưu hiệu năng 120Hz mượt mà"
    });
}
