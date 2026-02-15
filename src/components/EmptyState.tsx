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
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                {icon || <Heart className="w-10 h-10 text-gray-500" />}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-center max-w-md mb-6">{description}</p>
            {action && (
                <a
                    href={action.href}
                    className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
                >
                    {action.label}
                </a>
            )}
        </div>
    );
}
