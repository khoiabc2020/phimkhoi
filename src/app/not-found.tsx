import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-center px-4 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Large 404 background text */}
            <div className="relative select-none mb-2">
                <span className="text-[clamp(120px,25vw,220px)] font-black leading-none tracking-tighter bg-gradient-to-b from-white/15 via-white/6 to-transparent bg-clip-text text-transparent">
                    404
                </span>
            </div>

            <div className="relative -mt-6 sm:-mt-10 flex flex-col items-center">
                {/* Decorative line */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/30">Không tìm thấy</span>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Trang không tồn tại</h2>
                <p className="text-white/40 mb-8 max-w-sm mx-auto text-[14px] leading-relaxed">
                    Có vẻ bạn đang lạc vào một vũ trụ phim khác. Trang này không có sẵn hoặc đã bị di chuyển.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2.5 bg-white text-black font-bold px-8 py-3.5 rounded-full hover:bg-white/90 transition-all active:scale-95 shadow-[0_8px_30px_rgba(255,255,255,0.15)]"
                >
                    <Home className="w-4.5 h-4.5" />
                    Về Trang Chủ
                </Link>
            </div>
        </div>
    );
}
