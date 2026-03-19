export default function Loading() {
    return (
        <div className="min-h-[60vh] w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 pt-24">
            <div className="mb-5 rounded-[10px] border border-white/[0.06] bg-[#07070b]/78 px-3 sm:px-4 py-3 sm:py-3.5 shadow-[0_8px_20px_#00000055]">
                <div className="h-7 w-56 bg-white/[0.09] rounded-md mb-3 animate-pulse" />
                <div className="flex gap-2">
                    <div className="h-8 w-28 rounded-full bg-white/[0.08] animate-pulse" />
                    <div className="h-8 w-28 rounded-full bg-white/[0.06] animate-pulse" />
                </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-2.5 md:gap-3 [contain:layout_paint]">
                {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] rounded-lg bg-white/[0.06] border border-white/[0.06] animate-pulse" />
                ))}
            </div>
        </div>
    );
}
