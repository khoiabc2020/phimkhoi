"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";

function RegisterForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
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
        } catch (error) {
            setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative z-10 w-full max-w-[450px] mx-4 p-8 md:p-12 bg-black/80 border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center">
            <h1 className="text-3xl font-bold text-white mb-2 text-center w-full">Tạo tài khoản</h1>
            <p className="text-[#a3a3a3] text-[15px] mb-6 text-center w-full">Tham gia cộng đồng yêu phim ngay hôm nay.</p>

            {/* OAuth Buttons */}
            <div className="flex flex-col gap-3 w-full mb-5">
                <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="w-full flex items-center justify-center gap-3 h-[50px] bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 rounded-lg text-white font-medium text-sm transition-all duration-200"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Đăng ký bằng Google
                </button>
                <button
                    type="button"
                    onClick={() => signIn("facebook", { callbackUrl: "/" })}
                    className="w-full flex items-center justify-center gap-3 h-[50px] bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 hover:border-[#1877F2]/60 rounded-lg text-white font-medium text-sm transition-all duration-200"
                >
                    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Đăng ký bằng Facebook
                </button>
            </div>

            {/* Divider */}
            <div className="flex items-center w-full mb-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="mx-3 text-[#666] text-xs">hoặc tạo tài khoản mới</span>
                <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                {error && (
                    <div className="px-4 py-3 bg-[#e87c03] rounded text-white text-sm">
                        {error}
                    </div>
                )}

                <div className="relative group w-full">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c8c8c]" />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-[54px] bg-white/5 border border-white/10 rounded outline-none px-12 text-white text-base focus:bg-white/10 focus:border-white/20 transition-colors placeholder:text-[#8c8c8c]"
                        placeholder="Tên hiển thị"
                        required
                    />
                </div>

                <div className="relative group w-full">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c8c8c]" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-[54px] bg-white/5 border border-white/10 rounded outline-none px-12 text-white text-base focus:bg-white/10 focus:border-white/20 transition-colors placeholder:text-[#8c8c8c]"
                        placeholder="Email"
                        required
                    />
                </div>

                <div className="relative group w-full">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c8c8c]" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-[54px] bg-white/5 border border-white/10 rounded outline-none px-12 text-white text-base focus:bg-white/10 focus:border-white/20 transition-colors placeholder:text-[#8c8c8c]"
                        placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                        required
                        minLength={6}
                    />
                </div>

                <div className="relative group w-full">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c8c8c]" />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-[54px] bg-white/5 border border-white/10 rounded outline-none px-12 text-white text-base focus:bg-white/10 focus:border-white/20 transition-colors placeholder:text-[#8c8c8c]"
                        placeholder="Xác nhận mật khẩu"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#eab308] hover:bg-[#d9a307] text-black font-bold h-12 rounded transition-colors flex items-center justify-center shadow-[0_2px_10px_#EAB30833] disabled:opacity-70 disabled:cursor-not-allowed mt-1"
                >
                    {loading ? "Đang xử lý..." : "Đăng ký"}
                </button>

                <div className="text-[#8c8c8c] text-[15px] mt-8 text-center w-full pb-2">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="text-[#eab308] hover:underline font-bold ml-1">
                        Đăng nhập ngay
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center pt-24 pb-8 bg-[#0a0a0a] relative overflow-hidden font-sans">
            <div className="absolute top-6 left-6 md:top-8 md:left-12 z-20">
                <Link href="/" className="flex items-center gap-3 group shrink-0">
                    <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        <Image
                            src="/logo.png"
                            alt="MovieBox Logo"
                            width={48}
                            height={48}
                            className="relative w-full h-full rounded-[14px] object-cover shadow-lg ring-1 ring-white/10 group-hover:scale-105 group-hover:ring-white/20 transition-all duration-300"
                        />
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-none font-sans whitespace-nowrap">
                            Movie<span className="text-primary">Box</span>
                        </span>
                    </div>
                </Link>
            </div>

            <div className="fixed inset-0 z-0 h-full w-full">
                <Image
                    src="https://assets.nflxext.com/ffe/siteui/vlv3/e393bb3f-261f-43d1-99bb-16a157885615/web/VN-vi-20260105-TRIFECTA-perspective_ec5c484f-840e-4d19-9f35-b9e6a0eef2c7_medium.jpg"
                    alt="Background"
                    fill
                    priority
                    className="object-cover opacity-50"
                    unoptimized
                />
                <div className="absolute inset-0 bg-black/50 bg-gradient-to-t from-black via-black/20 to-black/60" />
            </div>

            <Suspense fallback={<div className="text-white relative z-10 w-full max-w-[450px] p-12 bg-black/70 backdrop-blur-2xl rounded-xl h-[400px] flex items-center justify-center border border-white/10 transform -translate-y-8">Đang tải...</div>}>
                <RegisterForm />
            </Suspense>
        </main>
    );
}
