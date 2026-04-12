"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, Check } from "lucide-react";
import AuthBrand from "@/components/auth/AuthBrand";

const FEATURES = [
    "Hàng nghìn bộ phim vietsub chất lượng cao",
    "Cập nhật phim mới mỗi ngày miễn phí",
    "Lưu danh sách & theo dõi tiến độ xem",
];

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
    const authError = searchParams.get("error");

    const getAuthErrorMessage = (errorParam: string | null) => {
        if (!errorParam) return "";
        switch (errorParam) {
            case "OAuthAccountNotLinked":
                return "Email này đã đăng ký qua Google/Facebook/Email khác. Vui lòng đăng nhập đúng kênh.";
            case "OAuthSignin":
            case "OAuthCallback":
            case "OAuthCreateAccount":
            case "EmailCreateAccount":
            case "Callback":
                return "Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.";
            case "CredentialsSignin":
                return "Sai tên đăng nhập hoặc mật khẩu";
            case "SessionRequired":
                return "Vui lòng đăng nhập để tiếp tục";
            default:
                return "Lỗi xác thực không xác định. Vui lòng thử lại.";
        }
    };

    useEffect(() => {
        if (authError) setError(getAuthErrorMessage(authError));
    }, [authError]);

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
        } catch {
            setError("Đã xảy ra lỗi, vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-[28px] md:text-[32px] font-black text-white mb-1.5 tracking-tight">Chào mừng trở lại</h1>
            <p className="text-white/40 text-[14px] mb-8">
                Nếu bạn chưa có tài khoản,{" "}
                <Link href="/register" className="text-[#8FA7C5] hover:text-[#a8bdd8] font-semibold transition-colors">
                    đăng ký ngay
                </Link>
            </p>

            {registered && (
                <div className="mb-6 p-4 bg-[#8FA7C5]/10 border border-[#8FA7C5]/30 rounded-xl text-[#8FA7C5] text-center font-medium text-sm">
                    Đăng ký thành công! Hãy đăng nhập ngay.
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                    <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/20 group-focus-within:text-[#8FA7C5] transition-colors" />
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full h-[52px] bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none pl-11 pr-4 text-white text-[15px] focus:bg-white/[0.06] focus:border-[#8FA7C5]/40 transition-all placeholder:text-white/20"
                        placeholder="Email hoặc tên đăng nhập"
                        required
                    />
                </div>

                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/20 group-focus-within:text-[#8FA7C5] transition-colors" />
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-[52px] bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none pl-11 pr-12 text-white text-[15px] focus:bg-white/[0.06] focus:border-[#8FA7C5]/40 transition-all placeholder:text-white/20"
                        placeholder="Mật khẩu"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                </div>

                <div className="flex justify-end -mt-1">
                    <Link href="/forgot-password" className="text-white/30 text-[13px] hover:text-[#8FA7C5] transition-colors">
                        Quên mật khẩu?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#8FA7C5] hover:bg-[#9fb8d6] text-[#060913] font-black h-[52px] rounded-xl transition-all shadow-[0_4px_20px_rgba(143,167,197,0.25)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-2"
                >
                    {isLoading ? "Đang xử lý..." : "Đăng nhập"}
                </button>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <main className="min-h-screen flex bg-[#070a10] font-sans">
            {/* Left decorative panel */}
            <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] relative flex-col items-center justify-center p-12 overflow-hidden shrink-0">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0d1520] via-[#080c14] to-[#060810]" />
                {/* Ambient glow */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-[#8FA7C5]/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-[#8FA7C5]/5 blur-[80px] rounded-full pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-start w-full max-w-sm">
                    <AuthBrand />
                    <p className="mt-5 text-white/40 text-[15px] leading-relaxed">
                        Kho phim khổng lồ, vietsub chất lượng cao, cập nhật hàng ngày.
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

                    {/* Decorative movie card stack */}
                    <div className="mt-16 relative w-full h-[180px]">
                        <div className="absolute left-0 top-4 w-[90px] h-[130px] rounded-xl bg-gradient-to-br from-white/10 to-white/[0.03] border border-white/[0.08] rotate-[-6deg] shadow-2xl" />
                        <div className="absolute left-12 top-0 w-[90px] h-[130px] rounded-xl bg-gradient-to-br from-white/8 to-white/[0.02] border border-white/[0.06] rotate-[-2deg] shadow-2xl" />
                        <div className="absolute left-24 top-3 w-[90px] h-[130px] rounded-xl bg-gradient-to-br from-[#8FA7C5]/15 to-white/[0.02] border border-[#8FA7C5]/20 rotate-[3deg] shadow-2xl" />
                    </div>
                </div>

                {/* Right border divider */}
                <div className="absolute right-0 top-[10%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12 lg:py-12 relative">
                {/* Mobile logo */}
                <div className="lg:hidden absolute top-6 left-6">
                    <AuthBrand compact />
                </div>

                <div className="w-full max-w-[400px]">
                    <Suspense fallback={<div className="h-[340px] bg-white/[0.02] animate-pulse rounded-xl" />}>
                        <LoginForm />
                    </Suspense>
                </div>
            </div>
        </main>
    );
}
