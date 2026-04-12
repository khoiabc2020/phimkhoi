"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Mail, Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import AuthBrand from "@/components/auth/AuthBrand";

const FEATURES = [
    "Hàng nghìn bộ phim vietsub chất lượng cao",
    "Cập nhật phim mới mỗi ngày miễn phí",
    "Lưu danh sách & theo dõi tiến độ xem",
];

function RegisterForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            if (res.ok) {
                router.push("/login?registered=true");
            } else {
                const data = await res.json();
                setError(data.error || "Đăng ký thất bại");
            }
        } catch {
            setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-[28px] md:text-[32px] font-black text-white mb-1.5 tracking-tight">Tạo tài khoản</h1>
            <p className="text-white/40 text-[14px] mb-8">
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-[#8FA7C5] hover:text-[#a8bdd8] font-semibold transition-colors">
                    Đăng nhập ngay
                </Link>
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                    <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/20 group-focus-within:text-[#8FA7C5] transition-colors" />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-[52px] bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none pl-11 pr-4 text-white text-[15px] focus:bg-white/[0.06] focus:border-[#8FA7C5]/40 transition-all placeholder:text-white/20"
                        placeholder="Tên hiển thị"
                        required
                    />
                </div>

                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/20 group-focus-within:text-[#8FA7C5] transition-colors" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-[52px] bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none pl-11 pr-4 text-white text-[15px] focus:bg-white/[0.06] focus:border-[#8FA7C5]/40 transition-all placeholder:text-white/20"
                        placeholder="Email"
                        required
                    />
                </div>

                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/20 group-focus-within:text-[#8FA7C5] transition-colors" />
                    <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-[52px] bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none pl-11 pr-12 text-white text-[15px] focus:bg-white/[0.06] focus:border-[#8FA7C5]/40 transition-all placeholder:text-white/20"
                        placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                        required
                        minLength={6}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors">
                        {showPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                </div>

                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/20 group-focus-within:text-[#8FA7C5] transition-colors" />
                    <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-[52px] bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none pl-11 pr-12 text-white text-[15px] focus:bg-white/[0.06] focus:border-[#8FA7C5]/40 transition-all placeholder:text-white/20"
                        placeholder="Xác nhận mật khẩu"
                        required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors">
                        {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#8FA7C5] hover:bg-[#9fb8d6] text-[#060913] font-black h-[52px] rounded-xl transition-all shadow-[0_4px_20px_rgba(143,167,197,0.25)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-2"
                >
                    {loading ? "Đang xử lý..." : "Đăng ký"}
                </button>
            </form>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <main className="min-h-screen flex bg-[#070a10] font-sans">
            {/* Left decorative panel */}
            <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] relative flex-col items-center justify-center p-12 overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0d1520] via-[#080c14] to-[#060810]" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-[#8FA7C5]/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-[#8FA7C5]/5 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col items-start w-full max-w-sm">
                    <AuthBrand />
                    <p className="mt-5 text-white/40 text-[15px] leading-relaxed">
                        Tham gia cộng đồng yêu phim. Hoàn toàn miễn phí.
                    </p>

                    <div className="mt-10 flex flex-col gap-4">
                        {FEATURES.map((feat) => (
                            <div key={feat} className="flex items-center gap-3 text-white/55 text-[14px]">
                                <span className="w-5 h-5 rounded-full bg-[#8FA7C5]/15 border border-[#8FA7C5]/30 flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 text-[#8FA7C5]" />
                                </span>
                                {feat}
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 relative w-full h-[180px]">
                        <div className="absolute left-0 top-4 w-[90px] h-[130px] rounded-xl bg-gradient-to-br from-white/10 to-white/[0.03] border border-white/[0.08] rotate-[-6deg] shadow-2xl" />
                        <div className="absolute left-12 top-0 w-[90px] h-[130px] rounded-xl bg-gradient-to-br from-white/8 to-white/[0.02] border border-white/[0.06] rotate-[-2deg] shadow-2xl" />
                        <div className="absolute left-24 top-3 w-[90px] h-[130px] rounded-xl bg-gradient-to-br from-[#8FA7C5]/15 to-white/[0.02] border border-[#8FA7C5]/20 rotate-[3deg] shadow-2xl" />
                    </div>
                </div>

                <div className="absolute right-0 top-[10%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12 lg:py-12 relative">
                <div className="lg:hidden absolute top-6 left-6">
                    <AuthBrand compact />
                </div>
                <div className="w-full max-w-[400px]">
                    <Suspense fallback={<div className="h-[420px] bg-white/[0.02] animate-pulse rounded-xl" />}>
                        <RegisterForm />
                    </Suspense>
                </div>
            </div>
        </main>
    );
}
