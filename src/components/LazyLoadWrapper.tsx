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
    rootMargin = "200px",
    className
}: LazyLoadWrapperProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    // Once visible, stop observing to keep it loaded
                    if (ref.current) observer.unobserve(ref.current);
                }
            },
            { threshold, rootMargin }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, [threshold, rootMargin]);

    return (
        <div ref={ref} className={cn("transition-all duration-500 ease-out empty:hidden", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 min-h-[150px]", className)}>
            {isVisible ? children : (fallback || null)}
        </div>
    );
}
