import Link from "next/link";

export default function AuthBrand({
    className = "",
    compact = false,
}: {
    className?: string;
    compact?: boolean;
}) {
    return (
        <Link href="/" className={`group inline-flex flex-col ${className}`.trim()}>
            <span
                className={
                    compact
                        ? "font-logo text-[28px] md:text-[34px] font-semibold uppercase tracking-[0.01em] leading-none text-white whitespace-nowrap"
                        : "font-logo text-3xl md:text-4xl lg:text-5xl font-semibold uppercase tracking-[0.01em] leading-none text-white whitespace-nowrap"
                }
            >
                KHOIPHIM<span className="text-[#8FA7C5]">.</span>
            </span>
            {!compact && (
                <span className="mt-2 text-[11px] md:text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
                    Cine Account
                </span>
            )}
        </Link>
    );
}
