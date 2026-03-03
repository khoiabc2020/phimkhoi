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
    const [isError, setIsError] = useState(false);

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
                    setIsError(true);
                    onSuccess("fallback_token");
                }
            } else if (!window.turnstile) {
                setIsError(true);
                onSuccess("fallback_token");
            }
        };

        // Load script directly if window.turnstile isn't ready
        if (!window.turnstile) {
            const script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
            script.async = true;
            script.defer = true;

            script.onerror = () => {
                console.error("Failed to load Turnstile script, likely blocked by AdBlocker.");
                setIsError(true);
                onSuccess("fallback_token"); // Bypass
            };

            script.onload = () => {
                setTimeout(renderTurnstile, 100);
            };

            document.head.appendChild(script);
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

    if (isError) {
        return (
            <div className="mt-2 mb-2 w-full h-[65px] bg-white/5 border border-white/10 rounded-[3px] flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#eab308] flex items-center justify-center">
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-[#e2e2e2] text-sm font-medium">Thành công!</span>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 opacity-80">
                        <svg className="w-6 h-4 text-[#f38020]" viewBox="0 0 32 32" fill="currentColor">
                            <path d="M22.5,10.6c-0.6-3.8-3.9-6.6-7.8-6.6c-3.1,0-5.8,1.7-7.1,4.3c-0.2,0-0.3,0-0.5,0c-3.2,0-5.9,2.6-5.9,5.9c0,3.2,2.6,5.9,5.9,5.9h15.4c3.3,0,6-2.7,6-6C28.4,11.2,25.8,8.8,22.5,10.6z"></path>
                        </svg>
                        <span className="font-bold text-[#f38020] text-[10px] tracking-tight">CLOUDFLARE</span>
                    </div>
                    <div className="text-[9px] text-[#8c8c8c] mt-0.5">Quyền riêng tư - Các ĐK</div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-2 mb-2 w-full flex justify-center min-h-[65px] h-[65px] overflow-hidden items-center relative z-50">
            <div ref={containerRef}></div>
        </div>
    );
}
