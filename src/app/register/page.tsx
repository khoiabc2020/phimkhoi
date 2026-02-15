"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
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
                setError(data.error || "Đăng kỳ thất bại");
            }
        } catch (error) {
            setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[url('https://phimimg.com/upload/vod/20240801-1/5b35c0293375815615d1858564245598.jpg')] bg-cover bg-center opacity-20 blur-sm" />
            <div className="absolute inset-0 bg-black/60" />

            <div className="relative z-10 w-full max-w-md p-8 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center mb-4 text-black font-bold text-3xl shadow-lg shadow-primary/50">
                        K
                    </div>
                    <h1 className="text-2xl font-bold text-white">Tạo Tài Khoản Mới</h1>
                    <p className="text-gray-400">Tham gia cộng đồng MovieBox</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Tên hiển thị</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors hover:border-white/20"
                                placeholder="Nhập tên của bạn"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors hover:border-white/20"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Mật khẩu</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors hover:border-white/20"
                                placeholder="Tạo mật khẩu mạnh"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-black font-bold py-3.5 rounded-lg hover:bg-yellow-400 transition-all transform hover:scale-[1.02] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        {loading ? "Đang xử lý..." : "Đăng Ký Ngay"} <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="text-primary hover:underline font-bold">
                        Đăng nhập
                    </Link>
                </div>
            </div>
        </main>
    );
}
