export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Base dark layout matcher for Hero */}
            <div className="relative w-full pt-20 sm:pt-28 md:pt-32 pb-8 px-4 md:px-8 lg:pl-24 lg:pr-12 flex items-end min-h-[500px] sm:min-h-[560px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/95 via-[45%] to-transparent z-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent z-0" />
                
                <div className="relative z-10 w-full max-w-[1920px] mx-auto flex flex-col md:flex-row items-end justify-between gap-8 md:gap-12">
                    <div className="space-y-4 max-w-[760px] flex-1">
                        <div className="flex items-center gap-2 mb-2">
                             <div className="h-5 w-12 bg-white/10 rounded animate-pulse" />
                             <div className="h-5 w-16 bg-[#8FA7C5]/20 rounded animate-pulse" />
                        </div>
                        <div className="h-10 sm:h-12 w-3/4 max-w-[400px] bg-white/10 rounded-lg animate-pulse" />
                        <div className="h-6 w-1/2 max-w-[300px] bg-white/5 rounded-md animate-pulse hidden sm:block mt-2" />
                        <div className="h-4 w-3/4 bg-white/5 rounded-md animate-pulse mt-4" />
                        <div className="h-4 w-2/3 bg-white/5 rounded-md animate-pulse mt-2" />
                        
                        <div className="flex gap-3 pt-4">
                            <div className="w-32 h-12 rounded-full bg-white/10 animate-pulse" />
                            <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
                            <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
                            <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Content Skeleton */}
            <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:pl-24 lg:pr-12 mt-6 sm:mt-10 lg:mt-12 relative z-10">
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* RIGHT COLUMN */}
                    <div className="w-full lg:col-span-8 xl:col-span-9 order-1 lg:order-2 space-y-6">
                        <div className="flex gap-6 mb-4">
                            <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
                            <div className="h-5 w-24 bg-white/5 rounded animate-pulse" />
                        </div>
                        <div className="h-64 rounded-[10px] bg-[#07070b]/78 border border-white/[0.05] animate-pulse" />
                    </div>

                    {/* LEFT SIDEBAR */}
                    <div className="w-full lg:col-span-4 xl:col-span-3 order-2 lg:order-1 space-y-6 lg:pr-4">
                        <div className="h-[400px] rounded-[10px] bg-[#07070b]/78 border border-white/[0.05] animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
