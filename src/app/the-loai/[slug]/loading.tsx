export default function Loading() {
    return (
        <div className="min-h-[60vh] pt-24 container mx-auto px-4 md:px-12">
            <div className="h-8 w-48 bg-white/10 rounded mb-6 animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
                ))}
            </div>
        </div>
    );
}
