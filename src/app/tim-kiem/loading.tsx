export default function Loading() {
    return (
        <div className="min-h-[60vh] container mx-auto px-4 pt-24">
            <div className="h-8 w-64 bg-white/10 rounded mb-6 animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
                ))}
            </div>
        </div>
    );
}
