export default function Loading() {
    return (
        <div className="min-h-[60vh] pt-24 w-full max-w-[1920px] mx-auto px-4 md:px-12">
            <div className="h-8 w-48 bg-white/10 rounded mb-6 animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-2.5 md:gap-3 mt-6 [contain:layout_paint]">
                {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
                ))}
            </div>
        </div>
    );
}
