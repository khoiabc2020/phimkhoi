export default function Loading() {
    return (
        <div className="min-h-screen bg-[#020617]">
            <div className="h-[50vh] md:h-[70vh] bg-white/5 animate-pulse" />
            <div className="container mx-auto px-4 md:px-12 py-8 space-y-8">
                <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="min-w-[130px] aspect-[2/3] rounded-xl bg-white/10 animate-pulse" />
                    ))}
                </div>
                <div className="h-6 w-40 bg-white/10 rounded animate-pulse mt-8" />
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="min-w-[130px] aspect-[2/3] rounded-xl bg-white/10 animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}
