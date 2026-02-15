"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login"); // Redirect to new login page
        } else if (status === "authenticated" && session?.user?.role !== "admin") {
            router.push("/");
        }
    }, [status, session, router]);

    if (!mounted || status === "loading") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (status === "unauthenticated" || (session?.user?.role !== "admin")) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col ml-64 min-h-screen">
                <AdminHeader />
                <main className="flex-1 p-8 mt-16 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
