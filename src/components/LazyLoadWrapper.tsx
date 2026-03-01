"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LazyLoadWrapperProps {
    children: ReactNode;
    fallback?: ReactNode;
    threshold?: number;
    rootMargin?: string;
    className?: string;
}

export function LazyLoadWrapper({
    children,
    fallback,
    threshold = 0,
    rootMargin = "400px",   // Increased: start fetching 400px before element enters viewport
    className
}: LazyLoadWrapperProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // If already in viewport (e.g. server-side), mark visible immediately
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 400) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold, rootMargin]);

    return (
        // Use opacity-only fade (no translate) to avoid Cumulative Layout Shift
        <div
            ref={ref}
            className={cn(
                "transition-opacity duration-500 ease-out empty:hidden",
                isVisible ? "opacity-100" : "opacity-0 min-h-[150px]",
                className
            )}
        >
            {isVisible ? children : (fallback ?? null)}
        </div>
    );
}
