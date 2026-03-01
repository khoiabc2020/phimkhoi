import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '@/constants/config';
import { router } from 'expo-router';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
    favorites?: any[];
    history?: any[];
    watchlist?: any[];
    playlists?: any[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
    syncFavorites: () => Promise<void>;
    syncHistory: () => Promise<void>;
    syncWatchList: () => Promise<void>;
    syncPlaylists: () => Promise<void>;
    syncAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Realtime sync interval: 60 seconds when app is foregrounded
const SYNC_INTERVAL_MS = 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const tokenRef = useRef<string | null>(null);
    const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Keep tokenRef in sync with token state for use in callbacks without stale closures
    useEffect(() => { tokenRef.current = token; }, [token]);

    useEffect(() => {
        loadStorage();
        return () => {
            if (syncTimerRef.current) clearInterval(syncTimerRef.current);
        };
    }, []);

    // Start periodic sync when token is available, stop when logged out
    useEffect(() => {
        if (syncTimerRef.current) clearInterval(syncTimerRef.current);
        if (token) {
            // Initial sync immediately after login
            syncAllWithToken(token);
            // Then sync every SYNC_INTERVAL_MS
            syncTimerRef.current = setInterval(() => {
                if (tokenRef.current) syncAllWithToken(tokenRef.current);
            }, SYNC_INTERVAL_MS);
        }
        return () => {
            if (syncTimerRef.current) clearInterval(syncTimerRef.current);
        };
    }, [token]);

    const syncAllWithToken = async (t: string) => {
        try {
            const [histRes, favRes, wlRes, plRes] = await Promise.allSettled([
                fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/history`, { headers: { Authorization: `Bearer ${t}` } }),
                fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/favorites`, { headers: { Authorization: `Bearer ${t}` } }),
                fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/watchlist`, { headers: { Authorization: `Bearer ${t}` } }),
                fetch(`${CONFIG.BACKEND_URL}/api/user/playlists`, { headers: { Authorization: `Bearer ${t}` } }),
            ]);

            const updates: Partial<User> = {};

            if (histRes.status === 'fulfilled' && histRes.value.ok) {
                const d = await histRes.value.json();
                updates.history = d.history ?? d;
            }
            if (favRes.status === 'fulfilled' && favRes.value.ok) {
                const d = await favRes.value.json();
                updates.favorites = d.favorites ?? d;
            }
            if (wlRes.status === 'fulfilled' && wlRes.value.ok) {
                const d = await wlRes.value.json();
                updates.watchlist = d.watchlist ?? d;
            }
            if (plRes.status === 'fulfilled' && plRes.value.ok) {
                const d = await plRes.value.json();
                updates.playlists = d.playlists ?? d;
            }

            if (Object.keys(updates).length > 0) {
                setUser(prev => {
                    if (!prev) return null;
                    const merged = { ...prev, ...updates };
                    AsyncStorage.setItem('auth_user', JSON.stringify(merged)).catch(() => { });
                    return merged;
                });
            }
        } catch (err) {
            if (__DEV__) console.warn('[Auth] Background sync error:', err);
        }
    };

    const loadStorage = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('auth_token');
            const storedUser = await AsyncStorage.getItem('auth_user');
            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                // Full sync will be triggered by the token useEffect
            }
        } catch (error) {
            console.error('Failed to load auth storage', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (newToken: string, newUser: User) => {
        try {
            setToken(newToken);
            setUser(newUser);
            await AsyncStorage.setItem('auth_token', newToken);
            await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
        } catch (error) {
            console.error('Login error', error);
        }
    };

    const logout = async () => {
        try {
            if (syncTimerRef.current) clearInterval(syncTimerRef.current);
            setToken(null);
            setUser(null);
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('auth_user');
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Logout error', error);
        }
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
    };

    const syncFavorites = useCallback(async () => {
        if (!tokenRef.current) return;
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/favorites`, {
                headers: { Authorization: `Bearer ${tokenRef.current}` }
            });
            const data = await res.json();
            if (res.ok) setUser(prev => prev ? { ...prev, favorites: data.favorites } : null);
        } catch (e) { console.error(e); }
    }, []);

    const syncHistory = useCallback(async () => {
        if (!tokenRef.current) return;
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/history`, {
                headers: { Authorization: `Bearer ${tokenRef.current}` }
            });
            const data = await res.json();
            if (res.ok) setUser(prev => prev ? { ...prev, history: data.history } : null);
        } catch (e) { console.error(e); }
    }, []);

    const syncWatchList = useCallback(async () => {
        if (!tokenRef.current) return;
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/watchlist`, {
                headers: { Authorization: `Bearer ${tokenRef.current}` }
            });
            const data = await res.json();
            if (res.ok) setUser(prev => prev ? { ...prev, watchlist: data.watchlist } : null);
        } catch (e) { console.error(e); }
    }, []);

    const syncPlaylists = useCallback(async () => {
        if (!tokenRef.current) return;
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/user/playlists`, {
                headers: { Authorization: `Bearer ${tokenRef.current}` }
            });
            const data = await res.json();
            if (res.ok) setUser(prev => prev ? { ...prev, playlists: data.playlists ?? data } : null);
        } catch (e) { console.error(e); }
    }, []);

    const syncAll = useCallback(async () => {
        if (!tokenRef.current) return;
        await syncAllWithToken(tokenRef.current);
    }, []);

    return (
        <AuthContext.Provider value={{
            user, token, isLoading,
            login, logout, updateUser,
            syncFavorites, syncHistory, syncWatchList, syncPlaylists, syncAll
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
