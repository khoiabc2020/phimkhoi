/**
 * Wrapper around fetch() for all BACKEND_URL requests.
 * Adds browser-like headers so Cloudflare bot protection passes through.
 */
export const MOBILE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
    'X-Requested-With': 'KhoiPhimApp',
};

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const mergedHeaders: Record<string, string> = {
        ...MOBILE_HEADERS,
        ...(options.headers as Record<string, string> || {}),
    };
    return fetch(url, { ...options, headers: mergedHeaders });
}
