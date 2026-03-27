export type ImageOrientation = "portrait" | "landscape" | "unknown";

export type MovieMediaLike = {
    poster_url?: string | null;
    thumb_url?: string | null;
};

type MediaRole = "poster" | "thumb";

type Candidate = {
    value: string;
    role: MediaRole;
    orientation: ImageOrientation;
};

const TRUSTED_LOCAL_PREFIXES = ["/images", "/icons", "/favicon", "/_next", "/api", "/placeholder"];

const PHIMIMG_UPLOAD_PREFIXES = [
    "upload/",
    "/upload/",
    "uploads/",
    "/uploads/",
    "vod/",
    "/vod/",
];

const LEGACY_CDN_HOSTS = new Set(["phimimg.com"]);

const getNormalizedInput = (url: unknown) => String(url || "").trim();

export function normalizeImageUrl(url: unknown): string {
    const normalized = getNormalizedInput(url);
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
                LEGACY_CDN_HOSTS.has(parsed.hostname) &&
                (
                    parsed.pathname.startsWith("/upload/") ||
                    parsed.pathname.startsWith("/uploads/") ||
                    parsed.pathname.startsWith("/vod/")
                );

            if (isLegacyUpload) {
                finalUrl = `https://img.phimapi.com${parsed.pathname}${parsed.search}`;
            }
        } catch {
            return finalUrl;
        }
    }

    return finalUrl;
}

export function detectImageOrientation(url?: string | null): ImageOrientation {
    const normalized = normalizeImageUrl(url).toLowerCase();
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

function buildCandidates(media?: MovieMediaLike | null): Candidate[] {
    const candidates: Candidate[] = [];
    const pushCandidate = (value: unknown, role: MediaRole) => {
        const normalized = normalizeImageUrl(value);
        if (!normalized) return;

        candidates.push({
            value: normalized,
            role,
            orientation: detectImageOrientation(normalized),
        });
    };

    pushCandidate(media?.poster_url, "poster");
    pushCandidate(media?.thumb_url, "thumb");

    return candidates;
}

function pickCandidate(
    candidates: Candidate[],
    preferredRole: MediaRole,
    preferredOrientation: ImageOrientation
): string {
    const strictMatch = candidates.find(
        (candidate) => candidate.role === preferredRole && candidate.orientation === preferredOrientation
    );
    if (strictMatch) return strictMatch.value;

    const anyRoleMatch = candidates.find((candidate) => candidate.orientation === preferredOrientation);
    if (anyRoleMatch) return anyRoleMatch.value;

    const unknownRoleMatch = candidates.find(
        (candidate) => candidate.role === preferredRole && candidate.orientation === "unknown"
    );
    if (unknownRoleMatch) return unknownRoleMatch.value;

    return "";
}

export function resolveMovieImages(media?: MovieMediaLike | null) {
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
        poster_url,
        thumb_url,
    };
}

export function normalizeMovieImages<T extends MovieMediaLike>(media?: T | null): T {
    const normalized = resolveMovieImages(media);
    return {
        ...(media || ({} as T)),
        poster_url: normalized.poster_url,
        thumb_url: normalized.thumb_url,
    };
}

export function hasPortraitImage(media?: MovieMediaLike | null) {
    return Boolean(resolveMovieImages(media).poster_url);
}

export function hasLandscapeImage(media?: MovieMediaLike | null) {
    return Boolean(resolveMovieImages(media).thumb_url);
}
