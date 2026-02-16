import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        version: "1.0.1",
        build: 2,
        force_update: false,
        download_url: "http://18.141.25.244/apk/app-release.apk",
        change_log: "- Sửa lỗi hiển thị hình ảnh\n- Thêm tính năng cập nhật ứng dụng\n- Cải thiện tốc độ tải phim"
    });
}
