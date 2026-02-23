import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';

export type MiniPlayerPayload = {
  url: string;
  title?: string;
  episode?: string;
};

type MiniPlayerContextType = {
  mini: MiniPlayerPayload | null;
  openMini: (payload: MiniPlayerPayload) => void;
  closeMini: () => void;
};

const MiniPlayerContext = createContext<MiniPlayerContextType | undefined>(undefined);

export function MiniPlayerProvider({ children }: { children: ReactNode }) {
  const [mini, setMini] = useState<MiniPlayerPayload | null>(null);

  const value = useMemo<MiniPlayerContextType>(() => ({
    mini,
    openMini: (payload) => setMini(payload),
    closeMini: () => setMini(null),
  }), [mini]);

  return (
    <MiniPlayerContext.Provider value={value}>
      {children}
    </MiniPlayerContext.Provider>
  );
}

export function useMiniPlayer() {
  const ctx = useContext(MiniPlayerContext);
  if (!ctx) throw new Error('useMiniPlayer must be used within MiniPlayerProvider');
  return ctx;
}

