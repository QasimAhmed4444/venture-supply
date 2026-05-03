import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const STORAGE_KEY = "vs.notificationPrefs";

export interface NotificationPreferences {
  soundEnabled: boolean;
  visualPulseEnabled: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  soundEnabled: false,
  visualPulseEnabled: true,
};

interface NotificationPreferencesContextValue extends NotificationPreferences {
  setSoundEnabled: (v: boolean) => void;
  setVisualPulseEnabled: (v: boolean) => void;
  playChime: () => void;
}

const NotificationPreferencesContext = createContext<NotificationPreferencesContextValue | undefined>(undefined);

function loadPrefs(): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return {
      soundEnabled: typeof parsed.soundEnabled === "boolean" ? parsed.soundEnabled : DEFAULT_PREFS.soundEnabled,
      visualPulseEnabled: typeof parsed.visualPulseEnabled === "boolean" ? parsed.visualPulseEnabled : DEFAULT_PREFS.visualPulseEnabled,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function persist(prefs: NotificationPreferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function NotificationPreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => loadPrefs());
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    persist(prefs);
  }, [prefs]);

  const setSoundEnabled = useCallback((v: boolean) => {
    setPrefs((p) => ({ ...p, soundEnabled: v }));
  }, []);

  const setVisualPulseEnabled = useCallback((v: boolean) => {
    setPrefs((p) => ({ ...p, visualPulseEnabled: v }));
  }, []);

  const playChime = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const now = ctx.currentTime;

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.18, now + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + duration + 0.02);
      };

      playTone(880, 0, 0.18);
      playTone(1320, 0.12, 0.22);
    } catch {
      /* audio not available — silent no-op */
    }
  }, []);

  const value = useMemo<NotificationPreferencesContextValue>(
    () => ({
      ...prefs,
      setSoundEnabled,
      setVisualPulseEnabled,
      playChime,
    }),
    [prefs, setSoundEnabled, setVisualPulseEnabled, playChime]
  );

  return (
    <NotificationPreferencesContext.Provider value={value}>
      {children}
    </NotificationPreferencesContext.Provider>
  );
}

export function useNotificationPreferences() {
  const ctx = useContext(NotificationPreferencesContext);
  if (!ctx) throw new Error("useNotificationPreferences must be used within NotificationPreferencesProvider");
  return ctx;
}
