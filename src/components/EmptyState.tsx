import Link from "next/link";
import { Heart } from "lucide-react";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        href: string;
    };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-6 shadow-inner">
                {icon || <Heart className="w-9 h-9 text-white/20" />}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-white/40 text-center max-w-sm text-[13px] leading-relaxed mb-6">{description}</p>
            {action && (
                <Link
                    href={action.href}
                    className="px-7 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-white/90 transition-all active:scale-95 shadow-[0_8px_30px_rgba(255,255,255,0.12)]"
                >
                    {action.label}
                </Link>
            )}
        </div>
    );
}
