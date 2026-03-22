"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function LoadingBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleStart = () => {
            setLoading(true);
            setProgress(10);
        };
        const handleComplete = () => {
            setProgress(100);
            setTimeout(() => {
                setLoading(false);
                setProgress(0);
            }, 300);
        };

        handleStart();
        // Since Next.js doesn't have native route change events in App Router for Link clicks easily, 
        // we trigger this effect on pathname/searchParams change.
        // For a more "Onflix" feel, we simulate a fast progress.
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(timer);
                    return 90;
                }
                return prev + 10;
            });
        }, 100);

        handleComplete();
        return () => clearInterval(timer);
    }, [pathname, searchParams]);

    if (!loading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
            <div 
                className="h-[3px] bg-[#8FA7C5] shadow-[0_0_10px_#8FA7C5] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
