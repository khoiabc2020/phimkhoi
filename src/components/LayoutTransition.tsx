"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function LayoutTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
    return <div className="w-full flex-1">{children}</div>;
    );
}
