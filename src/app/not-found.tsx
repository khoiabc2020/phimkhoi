import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-center px-4">
            <h1 className="text-9xl font-black text-white/5 bg-clip-text">404</h1>
            <div className="relative -mt-20">
                <h2 className="text-4xl font-bold text-white mb-4">Trang không tồn tại</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    Có vẻ như bạn đang lạc vào một vũ trụ phim khác. Trang bạn đang tìm không có sẵn hoặc đã bị di chuyển.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-primary text-black font-bold px-8 py-4 rounded-full hover:bg-yellow-400 transition-transform transform hover:scale-105"
                >
                    <Home className="w-5 h-5" />
                    Về Trang Chủ
                </Link>
            </div>
        </div>
    );
}
