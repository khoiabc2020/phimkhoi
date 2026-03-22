export default function CategoryLoading() {
    return (
        <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 relative animate-pulse">
            {/* Header Skeleton */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4 max-w-4xl">
                    <div className="w-20 h-4 bg-white/5 rounded" />
                    <div className="w-64 h-12 bg-white/5 rounded-lg" />
                </div>
                <div className="w-full md:w-32 h-10 bg-white/5 rounded-xl" />
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] rounded-lg bg-white/5" />
                ))}
            </div>
        </div>
    );
}
