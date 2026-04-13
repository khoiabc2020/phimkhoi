/**
 * Wrapper around fetch() for all BACKEND_URL requests.
 * Adds full Chrome-like headers so Cloudflare bot protection passes through.
 */
const SITE_ORIGIN = 'https://khoiphim.org';

export const MOBILE_HEADERS: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Origin': SITE_ORIGIN,
    'Referer': `${SITE_ORIGIN}/`,
    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'X-Requested-With': 'XMLHttpRequest',
};

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const mergedHeaders: Record<string, string> = {
        ...MOBILE_HEADERS,
        ...(options.headers as Record<string, string> || {}),
    };
    const res = await fetch(url, { ...options, headers: mergedHeaders });

    // API của chúng ta LUÔN trả về application/json.
    // Nếu content-type khác → Cloudflare đang chặn (HTML, JS challenge, turnstile…)
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
        throw new Error('CF_BLOCK');
    }
    return res;
}
