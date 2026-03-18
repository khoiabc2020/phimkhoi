"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Image from "next/image";
import Script from "next/script";

const hasGoogle = true; // controlled by env in NextAuth
const hasFacebook = true;

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
    const authError = searchParams.get("error"); // NextAuth default error query

    // Map NextAuth errors to human-readable Vietnamese text
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
            case "Default":
            default:
                return "Lỗi xác thực không xác định. Vui lòng thử lại.";
        }
    };

    // Initialize error state with NextAuth error if present
    useEffect(() => {
        if (authError) {
            setError(getAuthErrorMessage(authError as string));
        }
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
        } catch (err) {
            setError("Đã xảy ra lỗi, vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative z-10 w-full max-w-[450px] mx-4 p-8 md:p-12 bg-black/70 border border-white/15 rounded-2xl shadow-2xl flex flex-col items-center backdrop-blur-xl">
            <h1 className="text-3xl font-bold text-white mb-2 text-center w-full">Chào mừng trở lại</h1>
            <p className="text-[#a3a3a3] text-[15px] mb-8 text-center w-full">Cùng thưởng thức những bộ phim tuyệt vời nhất.</p>

            {registered && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-center font-medium animate-in fade-in slide-in-from-top-4">
                    🎉 Đăng ký thành công! Hãy đăng nhập ngay.
                </div>
            )}

            {/* Chỉ đăng nhập bằng tài khoản (ẩn Google/Facebook) */}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                {error && (
                    <div className="px-4 py-3 bg-[#e87c03] rounded text-white text-sm">
                        {error}
                    </div>
                )}

                <div className="relative group w-full">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c8c8c]" />
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full h-[54px] bg-white/5 border border-white/10 rounded outline-none px-12 text-white text-base focus:bg-white/10 focus:border-white/20 transition-colors placeholder:text-[#8c8c8c]"
                        placeholder="Email hoặc Tên đăng nhập"
                        required
                    />
                </div>

                <div className="relative group w-full">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c8c8c]" />
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-[54px] bg-white/5 border border-white/10 rounded outline-none px-12 text-white text-base focus:bg-white/10 focus:border-white/20 transition-colors placeholder:text-[#8c8c8c]"
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

                <div className="flex justify-end w-full cursor-pointer mb-2">
                    <Link href="/forgot-password" className="text-[#b3b3b3] text-[13px] hover:underline hover:text-white transition-colors">Quên mật khẩu?</Link>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#eab308] hover:bg-[#d9a307] text-black font-bold h-12 rounded transition-colors flex items-center justify-center shadow-[0_2px_10px_#EAB30833] disabled:opacity-70 disabled:cursor-not-allowed mt-1"
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
        <main className="min-h-screen flex flex-col items-center justify-center pt-24 pb-8 bg-[#0a0a0a] relative overflow-hidden font-sans">
            <div className="absolute top-6 left-6 md:top-8 md:left-12 z-20">
                <Link href="/" className="group shrink-0">
                    <span className="inline-block origin-left text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.055em] leading-none font-sans whitespace-nowrap [transform:scaleX(1.18)]">
                        <span className="text-[#9CA3AF]">CINE</span><span className="text-[#E50914]">FLIX</span>
                    </span>
                </Link>
            </div>

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

            <Suspense fallback={<div className="text-white relative z-10 w-full max-w-[450px] p-12 bg-black/70 backdrop-blur-2xl rounded-lg h-[400px] flex items-center justify-center border border-white/10 transform -translate-y-8">Đang tải...</div>}>
                <LoginForm />
            </Suspense>
        </main>
    );
}
