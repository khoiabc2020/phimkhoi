import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@phimkhoi_favorites';

export interface FavoriteMovie {
  movieId: string;
  movieSlug: string;
  movieName: string;
  movieOriginName: string;
  moviePoster: string;
  movieYear: number;
  movieQuality: string;
  movieCategories: string[];
  // Legacy support
  _id?: string;
  slug?: string;
  name?: string;
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
  if (list.some((m) => (m.movieSlug || m.slug) === (movie.movieSlug || movie.slug))) return;
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...list, movie]));
}

export async function removeFavorite(slug: string): Promise<void> {
  const list = await getFavorites().then((l) => l.filter((m) => (m.movieSlug || m.slug) !== slug));
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

export async function isFavorite(slug: string): Promise<boolean> {
  const list = await getFavorites();
  return list.some((m) => (m.movieSlug || m.slug) === slug);
}
