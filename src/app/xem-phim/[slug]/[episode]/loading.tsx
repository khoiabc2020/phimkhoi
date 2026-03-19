export default function WatchEpisodeLoading() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-16 md:pt-24 pb-16">
            <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">
                    <div className="lg:col-span-9">
                        <div className="w-full aspect-video rounded-[12px] bg-[#0b0b10] border border-white/[0.08] animate-pulse" />
                        <div className="mt-3 h-12 rounded-[10px] bg-[#0b0b10] border border-white/[0.08] animate-pulse" />
                        <div className="mt-4 h-64 rounded-[10px] bg-[#0b0b10] border border-white/[0.08] animate-pulse" />
                    </div>
                    <div className="lg:col-span-3 space-y-5">
                        <div className="h-40 rounded-[10px] bg-[#0b0b10] border border-white/[0.08] animate-pulse" />
                        <div className="h-80 rounded-[10px] bg-[#0b0b10] border border-white/[0.08] animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}

