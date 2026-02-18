import AsyncStorage from '@react-native-async-storage/async-storage';

const WATCH_LIST_KEY = '@phimkhoi_watchlist';

export interface WatchListMovie {
    _id: string;
    slug: string;
    name: string;
    poster_url?: string;
    thumb_url?: string;
}

export async function getWatchList(): Promise<WatchListMovie[]> {
    try {
        const json = await AsyncStorage.getItem(WATCH_LIST_KEY);
        return json ? JSON.parse(json) : [];
    } catch {
        return [];
    }
}

export async function addToWatchList(movie: WatchListMovie): Promise<void> {
    const list = await getWatchList();
    if (list.some((m) => m._id === movie._id)) return;
    await AsyncStorage.setItem(WATCH_LIST_KEY, JSON.stringify([...list, movie]));
}

export async function removeFromWatchList(movieId: string): Promise<void> {
    const list = await getWatchList().then((l) => l.filter((m) => m._id !== movieId));
    await AsyncStorage.setItem(WATCH_LIST_KEY, JSON.stringify(list));
}

export async function isInWatchList(movieId: string): Promise<boolean> {
    const list = await getWatchList();
    return list.some((m) => m._id === movieId);
}
