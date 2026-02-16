import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@phimkhoi_favorites';

export interface FavoriteMovie {
  _id: string;
  slug: string;
  name: string;
  poster_url?: string;
  thumb_url?: string;
}

export async function getFavorites(): Promise<FavoriteMovie[]> {
  try {
    const json = await AsyncStorage.getItem(FAVORITES_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function addFavorite(movie: FavoriteMovie): Promise<void> {
  const list = await getFavorites();
  if (list.some((m) => m._id === movie._id)) return;
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...list, movie]));
}

export async function removeFavorite(movieId: string): Promise<void> {
  const list = await getFavorites().then((l) => l.filter((m) => m._id !== movieId));
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

export async function isFavorite(movieId: string): Promise<boolean> {
  const list = await getFavorites();
  return list.some((m) => m._id === movieId);
}
