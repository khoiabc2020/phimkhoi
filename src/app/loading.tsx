export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-white/10 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">KP</span>
                </div>
            </div>
        </div>
    );
}
