import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '@/constants/config';
import { router } from 'expo-router';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
    favorites?: string[];
    history?: any[];
    watchlist?: any[];
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStorage();
    }, []);

    const loadStorage = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('auth_token');
            const storedUser = await AsyncStorage.getItem('auth_user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
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

            // router.replace('/(tabs)'); // Optional: Redirect after login
        } catch (error) {
            console.error('Login error', error);
        }
    };

    const logout = async () => {
        try {
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

    const syncFavorites = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/favorites`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setUser((prev) => prev ? { ...prev, favorites: data.favorites } : null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const syncHistory = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setUser((prev) => prev ? { ...prev, history: data.history } : null);
            }
        } catch (e) {
            console.error(e);
        }
    }

    const syncWatchList = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/watchlist`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setUser((prev) => prev ? { ...prev, watchlist: data.watchlist } : null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser, syncFavorites, syncHistory, syncWatchList }}>
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
