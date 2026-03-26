const TRUSTED_LOCAL_PREFIXES = ["/images", "/icons", "/favicon", "/_next"];
const PHIMIMG_UPLOAD_PREFIXES = ["upload/", "/upload/", "uploads/", "/uploads/", "vod/", "/vod/"];

const normalizeInput = (value) => String(value || "").trim();

export function normalizeImageUrl(value) {
    const normalized = normalizeInput(value);
    if (!normalized) return "";

    let finalUrl = normalized;

    if (!normalized.startsWith("http")) {
        if (TRUSTED_LOCAL_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
            finalUrl = normalized;
        } else if (PHIMIMG_UPLOAD_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
            finalUrl = `https://img.phimapi.com${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
        } else {
            finalUrl = normalized.startsWith("/") ? `https://phimimg.com${normalized}` : `https://phimimg.com/${normalized}`;
        }
    }

    if (finalUrl.startsWith("http")) {
        try {
            const parsed = new URL(finalUrl);
            const isLegacyUpload =
                parsed.hostname === "phimimg.com" &&
                (parsed.pathname.startsWith("/upload/") ||
                    parsed.pathname.startsWith("/uploads/") ||
                    parsed.pathname.startsWith("/vod/"));

            if (isLegacyUpload) {
                finalUrl = `https://img.phimapi.com${parsed.pathname}${parsed.search}`;
            }
        } catch {
            return finalUrl;
        }
    }

    return finalUrl;
}

export function detectImageOrientation(value) {
    const normalized = normalizeImageUrl(value).toLowerCase();
    if (!normalized) return "unknown";

    const isNguonc =
        normalized.includes("nguonc.com") ||
        normalized.includes("nguonc.top") ||
        normalized.includes("streamc.xyz") ||
        normalized.includes("phimmoi.net") ||
        normalized.includes("1080.com.vn");

    const isOphim =
        normalized.includes("img.ophim.live") ||
        normalized.includes("img.ophim1.com") ||
        normalized.includes("img.phimapi.com") ||
        normalized.includes("phimimg.com");

    if (isOphim || isNguonc) {
        if (
            normalized.includes("-thumb.") ||
            normalized.includes("/thumb-") ||
            normalized.endsWith("/thumb.jpg") ||
            normalized.endsWith("/thumb.png")
        ) {
            return "portrait";
        }

        if (
            normalized.includes("-poster.") ||
            normalized.includes("/poster-") ||
            normalized.endsWith("/poster.jpg") ||
            normalized.endsWith("/poster.png") ||
            normalized.includes("-backdrop") ||
            normalized.includes("-banner")
        ) {
            return "landscape";
        }
    }

    if (
        normalized.includes("backdrop") ||
        normalized.includes("banner") ||
        normalized.includes("landscape") ||
        normalized.includes("horizontal")
    ) {
        return "landscape";
    }

    if (
        normalized.includes("portrait") ||
        normalized.includes("vertical") ||
        normalized.includes("/poster/") ||
        normalized.includes("poster.")
    ) {
        return "portrait";
    }

    const dim = normalized.match(/(\d{2,4})x(\d{2,4})/);
    if (dim) {
        const width = parseInt(dim[1], 10);
        const height = parseInt(dim[2], 10);
        if (Number.isFinite(width) && Number.isFinite(height) && width !== height) {
            return height > width ? "portrait" : "landscape";
        }
    }

    return "unknown";
}

function buildCandidates(media = {}) {
    return [
        { value: normalizeImageUrl(media.poster_url), role: "poster" },
        { value: normalizeImageUrl(media.thumb_url), role: "thumb" },
    ]
        .filter((entry) => entry.value)
        .map((entry) => ({
            ...entry,
            orientation: detectImageOrientation(entry.value),
        }));
}

function pickCandidate(candidates, preferredRole, preferredOrientation) {
    return (
        candidates.find((candidate) => candidate.role === preferredRole && candidate.orientation === preferredOrientation)?.value ||
        candidates.find((candidate) => candidate.orientation === preferredOrientation)?.value ||
        candidates.find((candidate) => candidate.role === preferredRole && candidate.orientation === "unknown")?.value ||
        ""
    );
}

export function normalizeMovieImages(media = {}) {
    const candidates = buildCandidates(media);
    let poster_url = pickCandidate(candidates, "poster", "portrait");
    let thumb_url = pickCandidate(candidates, "thumb", "landscape");

    if (poster_url && thumb_url && poster_url === thumb_url) {
        const sharedOrientation = detectImageOrientation(poster_url);
        if (sharedOrientation === "landscape") {
            poster_url = "";
        } else {
            thumb_url = "";
        }
    }

    return {
        ...media,
        poster_url,
        thumb_url,
    };
}
