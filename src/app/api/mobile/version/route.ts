import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AppVersion } from '@/models/AppVersion';

export const dynamic = 'force-dynamic';
const FALLBACK_VERSION = {
    version: "1.0.8",
    build: 9,
    force_update: false,
    download_url: "https://khoiphim.io.vn/downloads/PhimKhoi-Release.apk",
    change_log: "Sửa lỗi đăng ký/đăng nhập mobile và nâng độ ổn định ứng dụng",
};

export async function GET() {
    try {
        await dbConnect();

        // Lấy phiên bản mới nhất từ database (sắp xếp theo thời gian tạo giảm dần)
        const latestVersion = await AppVersion.findOne().sort({ createdAt: -1 });

        if (latestVersion && Number(latestVersion.build || 0) >= FALLBACK_VERSION.build) {
            return NextResponse.json({
                version: latestVersion.version,
                build: latestVersion.build,
                force_update: latestVersion.force_update,
                download_url: latestVersion.download_url,
                change_log: latestVersion.change_log
            });
        }

        // Nếu DB rỗng hoặc build cũ hơn fallback, trả về bản fallback mới nhất
        return NextResponse.json(FALLBACK_VERSION);

    } catch (error) {
        console.error("Error fetching app version:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Endpoint ẩn để đẩy bản cập nhật mới (Bạn có thể bảo mật thêm bằng token/API_KEY)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        await dbConnect();

        const newVersion = await AppVersion.create({
            version: body.version,
            build: body.build,
            force_update: body.force_update || false,
            download_url: body.download_url,
            change_log: body.change_log
        });

        return NextResponse.json({ success: true, data: newVersion });
    } catch (error) {
        console.error("Error creating new app version:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
