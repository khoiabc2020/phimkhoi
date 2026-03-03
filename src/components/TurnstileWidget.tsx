"use client";

import { useState, useEffect } from "react";
import Script from "next/script";

interface TurnstileProps {
    siteKey: string;
    onSuccess: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
}

export default function TurnstileWidget({ siteKey, onSuccess, onError, onExpire }: TurnstileProps) {
    const [isError, setIsError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Fallback Timeout: Nếu sau 5 giây thư viện không báo Loaded (hoặc token không có),
        // khả năng cao nó đã bị block mạng/adblock ngầm. Ta kích hoạt Fallback bypass.
        const timer = setTimeout(() => {
            if (!isLoaded) {
                console.warn("Turnstile Widget load timeout. Enabling Bypass Fallback.");
                setIsError(true);
                onSuccess("bypass-timeout-token");
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [isLoaded, onSuccess]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            (window as any).onTurnstileSuccess = (token: string) => {
                setIsLoaded(true);
                onSuccess(token);
            };
            (window as any).onTurnstileError = () => {
                handleError();
            };
            (window as any).onTurnstileExpire = () => {
                if (onExpire) onExpire();
            };
        }
    }, [onSuccess, onError, onExpire]);

    const handleError = () => {
        console.error("Turnstile Widget encountered an error via API.");
        setIsError(true);
        onSuccess("bypass-error-token");
        if (onError) onError();
    };

    if (isError) {
        return (
            <div className="mt-2 mb-2 w-full h-[65px] bg-white/5 border border-white/10 rounded-[3px] flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#eab308] flex items-center justify-center">
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-[#e2e2e2] text-sm font-medium">Bảo mật tự động!</span>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 opacity-80">
                        <svg className="w-6 h-4 text-[#f38020]" viewBox="0 0 32 32" fill="currentColor">
                            <path d="M22.5,10.6c-0.6-3.8-3.9-6.6-7.8-6.6c-3.1,0-5.8,1.7-7.1,4.3c-0.2,0-0.3,0-0.5,0c-3.2,0-5.9,2.6-5.9,5.9c0,3.2,2.6,5.9,5.9,5.9h15.4c3.3,0,6-2.7,6-6C28.4,11.2,25.8,8.8,22.5,10.6z"></path>
                        </svg>
                        <span className="font-bold text-[#f38020] text-[10px] tracking-tight">CLOUDFLARE</span>
                    </div>
                    <div className="text-[9px] text-[#8c8c8c] mt-0.5">Bypass Fallback</div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-2 mb-2 w-full flex justify-center min-h-[65px] min-w-[300px] overflow-hidden items-center relative z-50">
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                strategy="lazyOnload"
                onLoad={() => setIsLoaded(true)}
            />
            <div
                className="cf-turnstile"
                data-sitekey={siteKey}
                data-callback="onTurnstileSuccess"
                data-error-callback="onTurnstileError"
                data-expired-callback="onTurnstileExpire"
                data-theme="dark"
                data-size="normal"
            ></div>
        </div>
    );
}
