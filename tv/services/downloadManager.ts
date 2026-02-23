/**
 * Download manager: tải HLS (m3u8 + segments) về thư mục local, cập nhật progress và localUri.
 * Gọi startQueue() khi mở màn Tải xuống hoặc sau khi thêm tải.
 */
import * as FileSystem from 'expo-file-system';
import { getDownloads, updateDownloadProgress, type DownloadItem, type DownloadEpisode } from '@/lib/downloads';

const DOWNLOAD_BASE = `${FileSystem.documentDirectory}Downloads/`;
const MAX_RETRIES = 2;

function getBaseUrl(m3u8Url: string): string {
  const last = m3u8Url.lastIndexOf('/');
  return last >= 0 ? m3u8Url.slice(0, last + 1) : m3u8Url + '/';
}

function resolveUrl(base: string, relative: string): string {
  const trimmed = relative.trim();
  if (!trimmed || trimmed.startsWith('#')) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) {
    try {
      const u = new URL(base);
      return `${u.origin}${trimmed}`;
    } catch {
      return base + trimmed.replace(/^\//, '');
    }
  }
  return base + trimmed;
}

/** Parse m3u8 nội dung, trả về danh sách URL segment (chỉ dòng không phải # và không rỗng) */
function parseM3u8Segments(content: string, baseUrl: string): string[] {
  const lines = content.split('\n');
  const segments: string[] = [];
  for (const line of lines) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const url = resolveUrl(baseUrl, s);
    if (url) segments.push(url);
  }
  return segments;
}

/** Tải một tập HLS: fetch m3u8, tải từng segment, ghi index.m3u8 local */
async function downloadHlsEpisode(
  movieSlug: string,
  epSlug: string,
  linkM3u8: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const dir = `${DOWNLOAD_BASE}${movieSlug}/${epSlug}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  const fetchWithRetry = async (url: string): Promise<string> => {
    let lastErr: Error | null = null;
    for (let r = 0; r <= MAX_RETRIES; r++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
        if (r < MAX_RETRIES) await new Promise((k) => setTimeout(k, 800));
      }
    }
    throw lastErr || new Error('Fetch failed');
  };

  let m3u8Url = linkM3u8;
  let baseUrl = getBaseUrl(m3u8Url);
  let m3u8Text = await fetchWithRetry(m3u8Url);
  let segments = parseM3u8Segments(m3u8Text, baseUrl);
  if (segments.length === 0) throw new Error('Không có segment trong m3u8');
  if (segments[0].includes('.m3u8')) {
    m3u8Url = segments[0];
    baseUrl = getBaseUrl(m3u8Url);
    m3u8Text = await fetchWithRetry(m3u8Url);
    segments = parseM3u8Segments(m3u8Text, baseUrl);
    if (segments.length === 0) throw new Error('Không có segment trong m3u8 (variant)');
  }

  const total = segments.length;
  const lines = m3u8Text.split('\n');
  const outLines: string[] = [];
  let segIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const s = line.trim();
    if (s.startsWith('#')) {
      outLines.push(line);
      continue;
    }
    if (!s) {
      outLines.push(line);
      continue;
    }
    const segUrl = resolveUrl(baseUrl, s);
    if (!segUrl) {
      outLines.push(line);
      continue;
    }
    const ext = segUrl.includes('.ts') ? 'ts' : 'mp4';
    const localName = `seg_${segIndex}.${ext}`;
    const localPath = dir + localName;
    let downloaded = false;
    for (let r = 0; r <= MAX_RETRIES && !downloaded; r++) {
      try {
        await FileSystem.downloadAsync(segUrl, localPath);
        downloaded = true;
      } catch (e) {
        if (r === MAX_RETRIES) throw e;
        await new Promise((k) => setTimeout(k, 500));
      }
    }
    outLines.push(localName);
    segIndex++;
    onProgress(Math.round((segIndex / total) * 100));
  }

  const indexPath = dir + 'index.m3u8';
  await FileSystem.writeAsStringAsync(indexPath, outLines.join('\n'));
  return indexPath;
}

let queueRunning = false;

export async function startQueue(): Promise<void> {
  if (queueRunning) return;
  queueRunning = true;
  try {
    for (;;) {
      const list = await getDownloads();
      let next: { item: DownloadItem; ep: DownloadEpisode } | null = null;
      for (const item of list) {
        const ep = item.episodes.find(
          (e) => (e.status === 'pending' || e.status === 'downloading') && e.link_m3u8 && !e.link_m3u8.includes('youtube')
        );
        if (ep) {
          next = { item, ep };
          break;
        }
      }
      if (!next) break;

      const { item, ep } = next;
      await updateDownloadProgress(item.movieSlug, ep.slug, 'downloading', 0);

      try {
        const localPath = await downloadHlsEpisode(
          item.movieSlug,
          ep.slug,
          ep.link_m3u8!,
          (progress) => updateDownloadProgress(item.movieSlug, ep.slug, 'downloading', progress)
        );
        const localUri = (localPath.startsWith('file://') ? localPath : `file://${localPath}`).replace(/\/+/g, '/');
        await updateDownloadProgress(item.movieSlug, ep.slug, 'done', 100, localUri);
      } catch (err: any) {
        await updateDownloadProgress(
          item.movieSlug,
          ep.slug,
          'error',
          undefined,
          undefined,
          err?.message || 'Lỗi tải'
        );
      }
    }
  } finally {
    queueRunning = false;
  }
}

export function isQueueRunning(): boolean {
  return queueRunning;
}

/** Xóa thư mục tải của phim (gọi khi user xóa khỏi danh sách tải) */
export async function deleteDownloadFolder(movieSlug: string): Promise<void> {
  const dir = `${DOWNLOAD_BASE}${movieSlug}`;
  try {
    const info = await FileSystem.getInfoAsync(dir, { size: false });
    if (info.exists) await FileSystem.deleteAsync(dir, { idempotent: true });
  } catch (_) {}
}
