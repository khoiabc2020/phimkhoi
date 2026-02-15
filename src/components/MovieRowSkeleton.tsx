export default function MovieRowSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 w-48 bg-gray-800 rounded ml-12" />
            <div className="flex gap-4 overflow-hidden px-12">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="min-w-[200px] aspect-[2/3] bg-gray-800 rounded-lg" />
                ))}
            </div>
        </div>
    );
}
