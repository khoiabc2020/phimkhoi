"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, CheckCircle2 } from "lucide-react";
import Image from "next/image";

function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const registered = searchParams.get("registered");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await signIn("credentials", {
                username,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Sai tên đăng nhập hoặc mật khẩu");
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (err) {
            setError("Đã xảy ra lỗi, vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative z-10 w-full max-w-[450px] p-8 md:p-12 bg-[#0a0a0a]/95 rounded-xl shadow-2xl flex flex-col items-center border border-white/5">
            <h1 className="text-3xl font-bold text-white mb-2 text-center w-full">Chào mừng trở lại</h1>
            <p className="text-[#a3a3a3] text-[15px] mb-8 text-center w-full">Cùng thưởng thức những bộ phim tuyệt vời nhất.</p>

            {registered && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-center font-medium animate-in fade-in slide-in-from-top-4">
                    🎉 Đăng ký thành công! Hãy đăng nhập ngay.
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                    <div className="px-4 py-3 bg-[#e87c03] rounded text-white text-sm">
                        {error}
                    </div>
                )}

                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c8c8c] peer-focus:text-white transition-colors" />
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full h-[54px] bg-[#222222] border border-transparent rounded outline-none px-12 text-white text-base focus:bg-[#333] focus:border-[#444] transition-colors peer placeholder:text-[#8c8c8c]"
                        placeholder="Email hoặc Tên đăng nhập"
                        required
                    />
                </div>

                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c8c8c] peer-focus:text-white transition-colors" />
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-[54px] bg-[#222222] border border-transparent rounded outline-none px-12 text-white text-base focus:bg-[#333] focus:border-[#444] transition-colors peer placeholder:text-[#8c8c8c]"
                        placeholder="Mật khẩu"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c8c8c] hover:text-[#b3b3b3] p-1 transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>

                {/* Giả lập Cloudflare Turnstile box */}
                <div className="mt-2 mb-2 w-full h-[65px] bg-[#222222] border border-[#333] rounded-[3px] flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-[#eab308] fill-[#eab308] text-black rounded-full bg-white" />
                        <span className="text-[#e2e2e2] text-sm">Thành công!</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 opacity-80">
                            {/* Cloudflare logo icon mock */}
                            <svg className="w-6 h-4 text-[#f38020]" viewBox="0 0 32 32" fill="currentColor">
                                <path d="M22.5,10.6c-0.6-3.8-3.9-6.6-7.8-6.6c-3.1,0-5.8,1.7-7.1,4.3c-0.2,0-0.3,0-0.5,0c-3.2,0-5.9,2.6-5.9,5.9c0,3.2,2.6,5.9,5.9,5.9h15.4c3.3,0,6-2.7,6-6C28.4,11.2,25.8,8.8,22.5,10.6z"></path>
                            </svg>
                            <span className="font-bold text-[#f38020] text-[10px] tracking-tight">CLOUDFLARE</span>
                        </div>
                        <div className="text-[9px] text-[#8c8c8c] hover:text-[#b3b3b3] cursor-pointer mt-0.5">Quyền riêng tư - Các ĐK</div>
                    </div>
                </div>

                <div className="flex justify-end w-full cursor-pointer mb-2">
                    <span className="text-[#b3b3b3] text-[13px] hover:underline">Quên mật khẩu?</span>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#eab308] hover:bg-[#d9a307] text-black font-bold h-12 rounded transition-colors flex items-center justify-center shadow-[0_2px_10px_rgba(234,179,8,0.2)] disabled:opacity-70 disabled:cursor-not-allowed mt-1"
                >
                    {isLoading ? "Đang xử lý..." : "Đăng nhập"}
                </button>

                <div className="text-[#8c8c8c] text-[15px] mt-8 text-center w-full pb-2">
                    Chưa có tài khoản?{" "}
                    <Link href="/register" className="text-[#eab308] hover:underline font-bold ml-1">
                        Đăng ký ngay
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden font-sans pt-16 pb-16">
            {/* Logo centered above the form */}
            <div className="relative z-20 mb-8 mt-4">
                <Link href="/" className="flex items-center group">
                    <span className="text-4xl md:text-[44px] font-black text-white tracking-tighter uppercase font-sans drop-shadow-lg">
                        MovieBox<span className="text-[#eab308]">.</span>
                    </span>
                </Link>
            </div>

            {/* Background Image requested by user */}
            <div className="absolute inset-0 z-0 h-full w-full">
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

            <Suspense fallback={<div className="text-white relative z-10 w-full max-w-[450px] p-12 bg-[#0a0a0a]/95 rounded-xl h-[400px] flex items-center justify-center border border-white/5">Loading...</div>}>
                <LoginForm />
            </Suspense>
        </main>
    );
}
