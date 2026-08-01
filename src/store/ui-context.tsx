import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

interface UiContextValue {
  toastVisible: boolean;
  toastText: string;
  showToast: (text: string) => void;
}

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastText, setToastText] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToastText(text);
    setToastVisible(true);
    timer.current = setTimeout(() => setToastVisible(false), 2400);
  }, []);

  return <UiContext.Provider value={{ toastVisible, toastText, showToast }}>{children}</UiContext.Provider>;
}

export function useUi(): UiContextValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
}
