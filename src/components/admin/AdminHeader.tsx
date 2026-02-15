"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, User } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

export default function AdminHeader() {
    const { data: session } = useSession();

    return (
        <header className="h-16 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-40">
            {/* Search */}
            <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Tìm kiếm thành viên, bình luận..."
                    className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                <div className="flex items-center gap-3 border-l border-white/10 pl-4">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-white">{session?.user?.name || "Admin"}</p>
                        <p className="text-xs text-gray-400 uppercase">{session?.user?.role || "Admin"}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-gray-800">
                        {session?.user?.image ? (
                            <img src={getImageUrl(session.user.image)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary text-black font-bold">
                                {session?.user?.name?.[0] || "A"}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
