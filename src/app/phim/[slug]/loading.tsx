export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <div className="h-[60vh] bg-white/5 animate-pulse" />
            <div className="container mx-auto px-4 md:px-8 -mt-80 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
                    <div className="w-48 md:w-56 lg:w-full max-w-[260px] aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
                    <div className="space-y-4">
                        <div className="h-10 w-3/4 bg-white/10 rounded animate-pulse" />
                        <div className="h-6 w-1/2 bg-white/5 rounded animate-pulse" />
                        <div className="flex gap-2 flex-wrap">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-8 w-20 bg-white/5 rounded animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
