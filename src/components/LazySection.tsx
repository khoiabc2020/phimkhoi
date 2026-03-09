"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface LazySectionProps {
    children: ReactNode;
    /**
     * Chiều cao tối thiểu khi chưa render nội dung (để không bị nhảy layout).
     */
    minHeight?: number;
    /**
     * Khoảng cách "đệm" để load trước khi scroll tới (ví dụ: "200px").
     */
    rootMargin?: string;
}

/**
 * LazySection: chỉ mount children khi gần vào viewport (IntersectionObserver).
 * Giúp giảm DOM & JS render ban đầu, cuộn mượt hơn trên máy yếu.
 */
export default function LazySection({
    children,
    minHeight = 320,
    rootMargin = "200px",
}: LazySectionProps) {
    const [visible, setVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (visible) return;
        const el = containerRef.current;
        if (!el) return;
        if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
            setVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry && (entry.isIntersecting || entry.intersectionRatio > 0)) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            {
                root: null,
                rootMargin,
                threshold: 0.01,
            }
        );

        observer.observe(el);

        return () => {
            observer.disconnect();
        };
    }, [rootMargin, visible]);

    return (
        <div
            ref={containerRef}
            style={visible ? undefined : { minHeight }}
        >
            {visible ? children : null}
        </div>
    );
}

