"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function LoadingBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const startLoading = () => {
            setLoading(true);
            setProgress(0);
            
            // Artificial progress steps
            timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) {
                        clearInterval(timer);
                        return 95;
                    }
                    const diff = Math.random() * 10;
                    return prev + diff;
                });
            }, 100);

            // Complete after a short delay (simulating load)
            setTimeout(() => {
                setProgress(100);
                setTimeout(() => {
                    setLoading(false);
                    setProgress(0);
                }, 400);
            }, 500);
        };

        startLoading();
        return () => {
            if (timer) clearInterval(timer);
        };
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
