"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, User } from "lucide-react";

function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const registered = searchParams.get("registered");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

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
    };

    return (
        <div className="relative z-10 w-full max-w-md p-8 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center mb-4 text-black font-bold text-3xl shadow-lg shadow-primary/50">
                    K
                </div>
                <h1 className="text-2xl font-bold text-white">Chào Mừng Trở Lại</h1>
                <p className="text-gray-400">MovieBox - Xem phim là mê</p>
            </div>

            {registered && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-center font-medium animate-in fade-in slide-in-from-top-4">
                    🎉 Đăng ký thành công! Hãy đăng nhập ngay.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Tài khoản</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors hover:border-white/20"
                            placeholder="Nhập tên đăng nhập"
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
                            placeholder="Nhập mật khẩu"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-primary text-black font-bold py-3.5 rounded-lg hover:bg-yellow-400 transition-all transform hover:scale-[1.02] shadow-lg shadow-primary/20"
                >
                    Đăng Nhập
                </button>

                <div className="text-center text-sm text-gray-400 mt-4">
                    Chưa có tài khoản?{" "}
                    <Link href="/register" className="text-primary hover:underline font-bold">
                        Đăng ký ngay
                    </Link>
                </div>
            </form>

            <div className="mt-8 text-center text-xs text-gray-500">
                <p>Tài khoản mặc định:</p>
                <p>Admin: admin / admin123</p>
                <p>User: user / user123</p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[url('https://phimimg.com/upload/vod/20240801-1/5b35c0293375815615d1858564245598.jpg')] bg-cover bg-center opacity-20 blur-sm" />
            <div className="absolute inset-0 bg-black/60" />

            <Suspense fallback={<div className="text-white relative z-10">Loading...</div>}>
                <LoginForm />
            </Suspense>
        </main>
    );
}
