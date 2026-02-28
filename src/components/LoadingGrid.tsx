export default function LoadingGrid({ count = 12 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="animate-pulse optimize-gpu contain-paint">
                    <div className="aspect-[2/3] bg-white/5 rounded-lg mb-2" />
                    <div className="h-4 bg-white/5 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
            ))}
        </div>
    );
}
