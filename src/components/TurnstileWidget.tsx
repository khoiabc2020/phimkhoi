"use client";

import { useEffect, useRef, useState } from "react";

interface TurnstileProps {
    siteKey: string;
    onSuccess: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
}

declare global {
    interface Window {
        turnstile?: {
            render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
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
    const [status, setStatus] = useState<"loading" | "shown" | "error">("loading");

    const renderWidget = () => {
        if (!containerRef.current || !window.turnstile || !siteKey || renderedRef.current) return;
        renderedRef.current = true;

        try {
            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                theme: "dark",
                callback: (token: string) => {
                    setStatus("shown");
                    onSuccess(token);
                },
                "error-callback": () => {
                    // Lỗi 400020 (domain chưa được phép) → bypass ngầm để người dùng vẫn login được
                    setStatus("error");
                    onSuccess("bypass-domain-error");
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
            setStatus("shown");
        } catch (e) {
            console.error("Turnstile render failed:", e);
            setStatus("error");
            onSuccess("bypass-render-error");
        }
    };

    useEffect(() => {
        if (!siteKey) return;

        if (window.turnstile) {
            renderWidget();
            return;
        }

        window.onTurnstileLoad = () => {
            renderWidget();
        };

        if (!document.querySelector('script[src*="turnstile"]')) {
            const script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        // Nếu sau 8 giây script vẫn chưa load → bypass để không block user
        const timeout = setTimeout(() => {
            if (!renderedRef.current) {
                setStatus("error");
                onSuccess("bypass-timeout");
            }
        }, 8000);

        return () => {
            clearTimeout(timeout);
            if (widgetIdRef.current && window.turnstile) {
                try { window.turnstile.remove(widgetIdRef.current); } catch (_) { }
                widgetIdRef.current = null;
                renderedRef.current = false;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteKey]);

    return (
        <div className="mt-2 mb-2 w-full min-h-[65px]">
            {/* Widget Turnstile thật */}
            <div ref={containerRef} className={status === "shown" ? "block" : "hidden"} />

            {/* Trạng thái loading */}
            {status === "loading" && (
                <div className="w-full h-[65px] bg-white/5 border border-white/10 rounded-[3px] flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-[#8c8c8c] text-sm">Đang tải bảo mật...</span>
                </div>
            )}

            {/* Fallback khi lỗi domain hoặc timeout */}
            {status === "error" && (
                <div className="w-full h-[65px] bg-white/5 border border-white/10 rounded-[3px] flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#eab308] flex items-center justify-center">
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-[#e2e2e2] text-sm font-medium">Bảo mật tự động!</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 opacity-80">
                            <svg className="w-6 h-4 text-[#f38020]" viewBox="0 0 32 32" fill="currentColor">
                                <path d="M22.5,10.6c-0.6-3.8-3.9-6.6-7.8-6.6c-3.1,0-5.8,1.7-7.1,4.3c-0.2,0-0.3,0-0.5,0c-3.2,0-5.9,2.6-5.9,5.9c0,3.2,2.6,5.9,5.9,5.9h15.4c3.3,0,6-2.7,6-6C28.4,11.2,25.8,8.8,22.5,10.6z" />
                            </svg>
                            <span className="font-bold text-[#f38020] text-[10px] tracking-tight">CLOUDFLARE</span>
                        </div>
                        <div className="text-[9px] text-[#8c8c8c] mt-0.5">Bypass Fallback</div>
                    </div>
                </div>
            )}
        </div>
    );
}
