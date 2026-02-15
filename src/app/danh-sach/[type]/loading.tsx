import LoadingGrid from "@/components/LoadingGrid";

export default function Loading() {
    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a]">
            <div className="pt-24 container mx-auto px-4 md:px-12">
                <div className="h-8 w-48 bg-white/10 rounded mb-2 animate-pulse" />
                <div className="h-4 w-24 bg-white/10 rounded mb-8 animate-pulse" />

                <div className="w-full h-12 bg-white/5 rounded-lg mb-6 animate-pulse" />

                <LoadingGrid count={12} />
            </div>
        </main>
    );
}
