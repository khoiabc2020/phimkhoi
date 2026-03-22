export default function CountryLoading() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] animate-pulse">
            {/* Hero Skeleton (if page 1) */}
            <div className="relative w-full aspect-video lg:h-[80vh] bg-neutral-900 overflow-hidden" />
            
            <div className="pt-8 px-4 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 space-y-12">
                {/* Row Skeleton */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-4">
                        <div className="w-48 h-8 bg-white/5 rounded" />
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3 overflow-hidden">
                            {Array.from({ length: 7 }).map((_, j) => (
                                <div key={j} className="aspect-[2/3] bg-white/5 rounded-lg" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
