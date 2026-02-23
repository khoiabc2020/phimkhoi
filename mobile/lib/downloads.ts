import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOADS_KEY = '@phimkhoi_downloads';

export type DownloadEpisodeStatus = 'pending' | 'downloading' | 'done' | 'error';

export interface DownloadEpisode {
  slug: string;
  name: string;
  status: DownloadEpisodeStatus;
  progress?: number; // 0-100
  /** HLS stream URL — lấy từ API khi thêm tải, dùng để tải về */
  link_m3u8?: string;
  /** Đường dẫn file local sau khi tải xong (file://...) */
  localUri?: string;
  errorMessage?: string;
}

export interface DownloadItem {
  movieSlug: string;
  movieName: string;
  posterUrl: string;
  serverIndex: number;
  episodes: DownloadEpisode[];
  addedAt: number;
}

export async function getDownloads(): Promise<DownloadItem[]> {
  try {
    const json = await AsyncStorage.getItem(DOWNLOADS_KEY);
    const parsed = json ? JSON.parse(json) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Lưu toàn bộ danh sách (dùng bởi download manager) */
export async function setDownloads(list: DownloadItem[]): Promise<void> {
  await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(list));
}

export async function addDownload(item: Omit<DownloadItem, 'addedAt'>): Promise<void> {
  const list = await getDownloads();
  const existing = list.findIndex((m) => m.movieSlug === item.movieSlug && m.serverIndex === item.serverIndex);
  const newItem: DownloadItem = { ...item, addedAt: Date.now() };
  if (existing >= 0) {
    const existingItem = list[existing];
    const newEps = item.episodes.filter((e) => !existingItem.episodes.some((x) => x.slug === e.slug));
    list[existing] = { ...existingItem, episodes: [...existingItem.episodes, ...newEps] };
  } else {
    list.unshift(newItem);
  }
  await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(list));
}

export async function updateDownloadProgress(
  movieSlug: string,
  epSlug: string,
  status: DownloadEpisodeStatus,
  progress?: number,
  localUri?: string,
  errorMessage?: string
): Promise<void> {
  const list = await getDownloads();
  const item = list.find((m) => m.movieSlug === movieSlug);
  if (!item) return;
  const ep = item.episodes.find((e) => e.slug === epSlug);
  if (ep) {
    ep.status = status;
    if (progress !== undefined) ep.progress = progress;
    if (localUri !== undefined) ep.localUri = localUri;
    if (errorMessage !== undefined) ep.errorMessage = errorMessage;
  }
  await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(list));
}

export async function removeDownload(movieSlug: string): Promise<void> {
  const list = await getDownloads().then((l) => l.filter((m) => m.movieSlug !== movieSlug));
  await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(list));
}

export async function removeEpisodeFromDownload(movieSlug: string, epSlug: string): Promise<void> {
  const list = await getDownloads();
  const item = list.find((m) => m.movieSlug === movieSlug);
  if (!item) return;
  item.episodes = item.episodes.filter((e) => e.slug !== epSlug);
  if (item.episodes.length === 0) {
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(list.filter((m) => m.movieSlug !== movieSlug)));
  } else {
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(list));
  }
}

/** Lấy URI phát offline cho tập đã tải (trả về undefined nếu chưa tải xong) */
export async function getLocalPlayUri(movieSlug: string, epSlug: string): Promise<string | undefined> {
  const list = await getDownloads();
  const item = list.find((m) => m.movieSlug === movieSlug);
  const ep = item?.episodes.find((e) => e.slug === epSlug);
  return ep?.status === 'done' && ep.localUri ? ep.localUri : undefined;
}
