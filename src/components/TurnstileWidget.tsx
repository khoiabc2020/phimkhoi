"use client";

import { useEffect, useRef } from "react";

interface TurnstileProps {
    siteKey: string;
    onSuccess: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
}

declare global {
    interface Window {
        turnstile?: {
            render: (container: string | HTMLElement, options: any) => string;
            remove: (widgetId: string) => void;
        };
        onTurnstileSuccess?: (token: string) => void;
        onTurnstileError?: () => void;
        onTurnstileExpire?: () => void;
    }
}

export default function TurnstileWidget({ siteKey, onSuccess, onError, onExpire }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Expose callbacks to global window object
        window.onTurnstileSuccess = onSuccess;
        window.onTurnstileError = onError;
        window.onTurnstileExpire = onExpire;

        // Function to render turnstile
        const renderTurnstile = () => {
            if (window.turnstile && containerRef.current && !widgetIdRef.current) {
                try {
                    widgetIdRef.current = window.turnstile.render(containerRef.current, {
                        sitekey: siteKey,
                        theme: "dark",
                        callback: "onTurnstileSuccess",
                        "error-callback": "onTurnstileError",
                        "expired-callback": "onTurnstileExpire",
                    });
                } catch (e) {
                    console.error("Turnstile render error", e);
                }
            }
        };

        // Load script directly if window.turnstile isn't ready
        if (!window.turnstile) {
            const script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);

            // Wait for script to load
            script.onload = () => {
                setTimeout(renderTurnstile, 100);
            };
        } else {
            renderTurnstile();
        }

        // Cleanup
        return () => {
            if (window.turnstile && widgetIdRef.current) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                    widgetIdRef.current = null;
                } catch (e) {
                    console.error("Turnstile remove error", e);
                }
            }

            // Cleanup globals to avoid memory leaks
            window.onTurnstileSuccess = undefined;
            window.onTurnstileError = undefined;
            window.onTurnstileExpire = undefined;
        };
    }, [siteKey, onSuccess, onError, onExpire]);

    return (
        <div className="mt-2 mb-2 w-full flex justify-center min-h-[65px] h-[65px] overflow-hidden items-center relative z-50">
            <div ref={containerRef}></div>
        </div>
    );
}
