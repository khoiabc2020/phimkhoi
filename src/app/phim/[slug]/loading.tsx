export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Base dark layout matcher for Hero */}
            <div className="relative w-full pt-12 sm:pt-20 md:pt-32 pb-8 px-4 md:px-8 lg:pl-24 lg:pr-12 flex items-center md:items-end min-h-[500px] sm:min-h-[560px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/92 via-[40%] to-transparent z-[1]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/65 to-transparent z-[1]" />
                
                <div className="relative z-10 w-full max-w-[1920px] mx-auto flex flex-col md:flex-row items-center md:items-end justify-center md:justify-between gap-6 md:gap-12 text-center md:text-left">
                    
                    {/* Poster Skeleton on Mobile */}
                    <div className="w-[140px] sm:w-[180px] md:hidden shrink-0 aspect-[2/3] rounded-xl bg-white/5 border border-white/10 animate-pulse" />

                    <div className="space-y-3 sm:space-y-4 max-w-[760px] flex-1 flex flex-col items-center md:items-start w-full">
                        <div className="flex items-center gap-2 mb-1">
                             <div className="h-5 w-12 bg-white/10 rounded animate-pulse" />
                             <div className="h-5 w-16 bg-[#8FA7C5]/20 rounded animate-pulse" />
                        </div>
                        <div className="h-10 sm:h-12 w-full max-w-[450px] bg-white/10 rounded-lg animate-pulse" />
                        <div className="h-6 w-1/2 max-w-[300px] bg-white/5 rounded-md animate-pulse hidden sm:block mt-2" />
                        
                        {/* Status/Episode Badge Skeleton */}
                        <div className="h-6 w-40 bg-white/10 rounded-full animate-pulse mt-2" />

                        {/* Promoted Metadata Row Skeleton (Mobile) */}
                        <div className="flex gap-2 mt-2 lg:hidden">
                            <div className="h-6 w-20 bg-[#8FA7C5]/10 rounded-full animate-pulse" />
                            <div className="h-6 w-20 bg-[#8FA7C5]/10 rounded-full animate-pulse" />
                            <div className="h-6 w-16 bg-white/5 rounded-md animate-pulse" />
                        </div>
                        
                        {/* Action Buttons Skeleton (2x2 on mobile) */}
                        <div className="grid grid-cols-2 md:flex gap-3 sm:gap-4 pt-4 pb-2 w-full max-w-[500px]">
                            <div className="h-14 rounded-full bg-[#8FA7C5]/20 animate-pulse w-full md:w-40" />
                            <div className="h-14 rounded-full bg-white/10 animate-pulse w-full md:w-14" />
                            <div className="hidden md:block h-14 w-14 rounded-full bg-white/5 animate-pulse" />
                            <div className="hidden md:block h-14 w-14 rounded-full bg-white/5 animate-pulse" />
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
                        <div className="h-64 rounded-[10px] bg-white/[0.03] border border-white/[0.05] animate-pulse" />
                    </div>

                    {/* LEFT SIDEBAR */}
                    <div className="w-full lg:col-span-4 xl:col-span-3 order-2 lg:order-1 space-y-6 lg:pr-4">
                        <div className="h-[400px] rounded-[10px] bg-white/[0.03] border border-white/[0.05] animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
