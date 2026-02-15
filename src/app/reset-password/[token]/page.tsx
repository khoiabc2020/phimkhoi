"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
    const { token } = useParams();
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setMessage("Đổi mật khẩu thành công!");
                setTimeout(() => router.push("/login"), 3000);
            } else {
                setError(data.error || "Có lỗi xảy ra");
            }
        } catch (err) {
            setError("Lỗi kết nối server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[url('https://phimimg.com/upload/vod/20240801-1/5b35c0293375815615d1858564245598.jpg')] bg-cover bg-center opacity-20 blur-sm" />
            <div className="absolute inset-0 bg-black/60" />

            <div className="relative z-10 w-full max-w-md p-8 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-500">
                {!success && (
                    <Link href="/login" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
                    </Link>
                )}

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white">Đặt Lại Mật Khẩu</h1>
                    {!success && <p className="text-gray-400 mt-2">Nhập mật khẩu mới của bạn</p>}
                </div>

                {success ? (
                    <div className="text-center space-y-4">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        <p className="text-green-400 text-lg font-medium">Mật khẩu đã được thay đổi thành công!</p>
                        <p className="text-gray-400 text-sm">Đang chuyển hướng về trang đăng nhập...</p>
                        <Link href="/login" className="inline-block px-6 py-2 bg-primary text-black font-bold rounded-full hover:bg-yellow-400 transition-colors mt-4">
                            Đăng nhập ngay
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Mật khẩu mới</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors hover:border-white/20"
                                    placeholder="Nhập mật khẩu mới"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Xác nhận mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors hover:border-white/20"
                                    placeholder="Nhập lại mật khẩu"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-black font-bold py-3.5 rounded-lg hover:bg-yellow-400 transition-all transform hover:scale-[1.02] shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
