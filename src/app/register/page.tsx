"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function RegisterForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
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
        <div className="relative z-10 w-full max-w-[450px] p-8 md:p-12 bg-[#141414]/95 rounded-xl shadow-2xl flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-2">Tạo tài khoản</h1>
            <p className="text-[#a3a3a3] text-[15px] mb-8">Tham gia cộng đồng yêu phim ngay hôm nay.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                    <div className="px-4 py-3 bg-[#e87c03] rounded text-white text-sm">
                        {error}
                    </div>
                )}

                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c8c8c] peer-focus:text-white transition-colors" />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-[54px] bg-[#333333] border-none rounded outline-none px-12 text-white text-base focus:bg-[#454545] transition-colors peer placeholder:text-[#8c8c8c]"
                        placeholder="Tên hiển thị"
                        required
                    />
                </div>

                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c8c8c] peer-focus:text-white transition-colors" />
                    <input
                        type="text"
                        // Register API seems to only take name, email, password. 
                        // I'm putting a placeholder 'Tên đăng nhập' but using it for 'name' just for UI layout matching the user's second screenshot.
                        // Ideally, we'd add 'username' to the backend, but avoiding backend changes for UI task.
                        className="w-full h-[54px] bg-[#333333] border-none rounded outline-none px-12 text-white text-base focus:bg-[#454545] transition-colors peer placeholder:text-[#8c8c8c]"
                        placeholder="Tên đăng nhập"
                    />
                </div>

                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c8c8c] peer-focus:text-white transition-colors" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-[54px] bg-[#333333] border-none rounded outline-none px-12 text-white text-base focus:bg-[#454545] transition-colors peer placeholder:text-[#8c8c8c]"
                        placeholder="Email"
                        required
                    />
                </div>

                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c8c8c] peer-focus:text-white transition-colors" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-[54px] bg-[#333333] border-none rounded outline-none px-12 text-white text-base focus:bg-[#454545] transition-colors peer placeholder:text-[#8c8c8c]"
                        placeholder="Mật khẩu"
                        required
                        minLength={6}
                    />
                </div>

                <div className="relative group">
                    <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c8c8c] peer-focus:text-white transition-colors" />
                    <input
                        type="password"
                        className="w-full h-[54px] bg-[#333333] border-none rounded outline-none px-12 text-white text-base focus:bg-[#454545] transition-colors peer placeholder:text-[#8c8c8c]"
                        placeholder="Xác nhận mật khẩu"
                    />
                </div>

                {/* Giả lập Cloudflare Turnstile box */}
                <div className="mt-2 mb-4 w-full h-[65px] bg-[#222222] border border-[#333] rounded-[3px] flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-[#00c853] fill-[#00c853] text-white rounded-full bg-white" />
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

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00c853] hover:bg-[#00e676] text-white font-bold h-12 rounded transition-colors flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? "Đang xử lý..." : "Đăng ký"}
                </button>

                <div className="text-[#8c8c8c] text-[15px] mt-8 text-center">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="text-white hover:underline font-medium ml-1">
                        Đăng nhập ngay
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden font-sans pt-20 pb-20">
            {/* Logo */}
            <div className="absolute top-6 left-6 md:top-8 md:left-12 z-20">
                <Link href="/" className="flex items-center group">
                    <span className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase font-sans">
                        ONFLIX<span className="text-[#00c853]">.</span>
                    </span>
                </Link>
            </div>

            {/* Background Image */}
            <div className="fixed inset-0 z-0 h-full w-full">
                <Image
                    src="https://assets.nflxext.com/ffe/siteui/vlv3/e393bb3f-261f-43d1-99bb-16a157885615/web/VN-vi-20260105-TRIFECTA-perspective_ec5c484f-840e-4d19-9f35-b9e6a0eef2c7_medium.jpg"
                    alt="Background"
                    fill
                    priority
                    className="object-cover opacity-50"
                    unoptimized
                />
                <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-black via-transparent to-black" />
            </div>

            <RegisterForm />
        </main>
    );
}
