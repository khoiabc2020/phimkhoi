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
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        onTurnstileLoad?: () => void;
    }
}

export default function TurnstileWidget({ siteKey, onSuccess, onError, onExpire }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const renderedRef = useRef(false);

    const renderWidget = () => {
        if (!containerRef.current || !window.turnstile || !siteKey || renderedRef.current) return;
        renderedRef.current = true;

        try {
            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                theme: "dark",
                callback: (token: string) => {
                    onSuccess(token);
                },
                "error-callback": () => {
                    if (onError) onError();
                },
                "expired-callback": () => {
                    if (onExpire) onExpire();
                    if (widgetIdRef.current && window.turnstile) {
                        window.turnstile.reset(widgetIdRef.current);
                        renderedRef.current = false;
                    }
                },
            });
        } catch (e) {
            console.error("Turnstile render failed:", e);
            renderedRef.current = false;
            if (onError) onError();
        }
    };

    useEffect(() => {
        if (!siteKey) return;

        // Nếu Turnstile API đã load sẵn → render ngay
        if (window.turnstile) {
            renderWidget();
            return;
        }

        // Đăng ký callback onload
        window.onTurnstileLoad = () => {
            renderWidget();
        };

        // Inject script nếu chưa có
        if (!document.querySelector('script[src*="turnstile"]')) {
            const script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        // Cleanup
        return () => {
            if (widgetIdRef.current && window.turnstile) {
                try { window.turnstile.remove(widgetIdRef.current); } catch (_) { }
                widgetIdRef.current = null;
                renderedRef.current = false;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteKey]);

    return (
        <div className="mt-2 mb-2 w-full flex justify-center min-h-[65px]">
            <div ref={containerRef} />
        </div>
    );
}
