"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VersionWatcher(): null {
    const router = useRouter();

    useEffect(() => {
        const checkVersion = async () => {
            try {
                // Fetch the current server build version/timestamp
                const res = await fetch("/api/version", { 
                    cache: "no-store",
                    headers: { 'Cache-Control': 'no-cache' } 
                });
                if (!res.ok) return;
                
                const data = await res.json();
                const serverVersion = data.version;
                if (!serverVersion) return;

                const localVersion = localStorage.getItem("app-version");

                // If no local version, set it.
                if (!localVersion) {
                    localStorage.setItem("app-version", serverVersion);
                    return;
                }

                // If version mismatch, force hard reload
                if (localVersion !== serverVersion) {
                    console.log(`Version mismatch detected! Local: ${localVersion}, Server: ${serverVersion}. Force refreshing...`);
                    localStorage.setItem("app-version", serverVersion);
                    
                    // Clear session reload tracker to allow one auto-recovery
                    sessionStorage.removeItem("last-error-reload");
                    
                    // Force hard reload
                    window.location.reload();
                }
            } catch (err) {
                console.error("Version check failed:", err);
            }
        };

        // Check on mount and periodically? 
        // For now, check only on mount to prevent infinite loop risks.
        checkVersion();

        // Also check on visibility change (when user returns to tab)
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                checkVersion();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    return null;
}
