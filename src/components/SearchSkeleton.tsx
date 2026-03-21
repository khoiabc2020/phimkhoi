import React from "react";

export default function SearchSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="flex items-center justify-between px-2 mb-4">
                <div className="h-3 w-24 bg-white/5 rounded-full" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-2.5">
                    <div className="w-12 h-16 rounded-lg bg-white/5 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-white/5 rounded-full" />
                        <div className="h-3 w-1/2 bg-white/5 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}
