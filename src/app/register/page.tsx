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
        <div className="relative z-10 w-full max-w-[450px] mx-4 p-8 md:p-12 bg-black/40 border border-white/10 rounded-[32px] shadow-2xl flex flex-col items-center backdrop-blur-3xl">
            <h1 className="text-3xl font-bold text-white mb-2 text-center w-full">Tạo tài khoản</h1>
            <p className="text-white/40 text-[15px] mb-6 text-center w-full">Tham gia cộng đồng yêu phim ngay hôm nay.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                {error && (
                    <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="relative group w-full">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#8FA7C5] transition-colors" />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-[56px] bg-white/[0.03] border border-white/5 rounded-xl outline-none px-12 text-white text-base focus:bg-white/[0.06] focus:border-[#8FA7C5]/40 transition-all placeholder:text-white/20"
                        placeholder="Tên hiển thị"
                        required
                    />
                </div>

                <div className="relative group w-full">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#8FA7C5] transition-colors" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-[56px] bg-white/[0.03] border border-white/5 rounded-xl outline-none px-12 text-white text-base focus:bg-white/[0.06] focus:border-[#8FA7C5]/40 transition-all placeholder:text-white/20"
                        placeholder="Email"
                        required
                    />
                </div>

                <div className="relative group w-full">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#8FA7C5] transition-colors" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-[56px] bg-white/[0.03] border border-white/5 rounded-xl outline-none px-12 text-white text-base focus:bg-white/[0.06] focus:border-[#8FA7C5]/40 transition-all placeholder:text-white/20"
                        placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                        required
                        minLength={6}
                    />
                </div>

                <div className="relative group w-full">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#8FA7C5] transition-colors" />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-[56px] bg-white/[0.03] border border-white/5 rounded-xl outline-none px-12 text-white text-base focus:bg-white/[0.06] focus:border-[#8FA7C5]/40 transition-all placeholder:text-white/20"
                        placeholder="Xác nhận mật khẩu"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#8FA7C5] hover:bg-[#8FA7C5]/80 text-[#0a0a0a] font-black h-14 rounded-2xl transition-all flex items-center justify-center shadow-xl shadow-[#8FA7C5]/10 disabled:opacity-50 disabled:cursor-not-allowed mt-4 active:scale-[0.98]"
                >
                    {loading ? "Đang xử lý..." : "Đăng ký"}
                </button>

                <div className="text-white/30 text-[15px] mt-8 text-center w-full pb-2">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="text-[#8FA7C5] hover:text-[#a8bdd8] font-bold ml-1 transition-colors">
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
                <Link href="/" className="group shrink-0">
                    <span className="inline-block font-logo text-3xl md:text-4xl lg:text-5xl font-semibold uppercase tracking-[0.012em] leading-none whitespace-nowrap">
                        <span className="text-[#9CA3AF]">KHOI</span><span className="text-[#8FA7C5]">PHIM</span>
                    </span>
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

            <Suspense fallback={<div className="text-white relative z-10 w-full max-w-[450px] p-12 bg-black/70 backdrop-blur-2xl rounded-lg h-[400px] flex items-center justify-center border border-white/10 transform -translate-y-8">Đang tải...</div>}>
                <RegisterForm />
            </Suspense>
        </main>
    );
}
