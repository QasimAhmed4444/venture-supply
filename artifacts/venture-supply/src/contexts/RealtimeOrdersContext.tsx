import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotificationPreferences } from "@/contexts/NotificationPreferencesContext";
import { useRole } from "@/contexts/RoleContext";
import { getSessionToken } from "@/lib/api";

export interface RealtimeNotification {
  id: string;
  type: "new_order" | "order_updated";
  trackingId: string;
  customerName: string;
  status?: string;
  at: number;
  read: boolean;
}

interface RealtimeOrdersContextValue {
  notifications: RealtimeNotification[];
  unreadCount: number;
  markAllRead: () => void;
  connected: boolean;
}

const RealtimeOrdersContext = createContext<RealtimeOrdersContextValue | undefined>(undefined);

const MAX_NOTIFICATIONS = 50;

export function RealtimeOrdersProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { soundEnabled, playChime } = useNotificationPreferences();
  const { role } = useRole();

  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [connected, setConnected] = useState(false);

  // Refs so the SSE event listeners always see the latest values without
  // forcing the EventSource to be re-created on every preference toggle
  // or language switch.
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const playChimeRef = useRef(playChime);
  playChimeRef.current = playChime;
  const languageRef = useRef(language);
  languageRef.current = language;
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Re-establish the SSE connection only when the realtime "identity"
  // changes — role gain/loss or token rotation. Navigating between dashboard
  // pages does not affect this provider, so the subscription persists.
  const token = role === "admin" || role === "sales" ? getSessionToken() : null;

  useEffect(() => {
    if (role !== "admin" && role !== "sales") {
      setConnected(false);
      return;
    }
    if (!token) {
      setConnected(false);
      return;
    }

    const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
    let destroyed = false;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (destroyed) return;
      const url = `${BASE}/api/realtime/orders?token=${encodeURIComponent(token!)}`;
      es = new EventSource(url);

      es.addEventListener("connected", () => {
        setConnected(true);
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      });

      es.addEventListener("order:new", (event: MessageEvent) => {
        try {
          const record = JSON.parse(event.data) as Record<string, unknown>;
          qc.invalidateQueries({ queryKey: ["orders"] });
          qc.invalidateQueries({ queryKey: ["dashboard"] });

          const notif: RealtimeNotification = {
            id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            type: "new_order",
            trackingId: String(record["tracking_id"] ?? ""),
            customerName: String(record["customer_name"] ?? ""),
            at: Date.now(),
            read: false,
          };
          setNotifications((prev) => [notif, ...prev].slice(0, MAX_NOTIFICATIONS));

          if (soundEnabledRef.current) playChimeRef.current();

          toastRef.current({
            title: languageRef.current === "ar" ? "🛒 طلب جديد!" : "🛒 New Order!",
            description: `${notif.trackingId} · ${notif.customerName}`,
          });
        } catch {
          /* ignore malformed */
        }
      });

      es.addEventListener("order:updated", (event: MessageEvent) => {
        try {
          const { record } = JSON.parse(event.data) as {
            record: Record<string, unknown>;
            old?: Record<string, unknown>;
          };
          qc.invalidateQueries({ queryKey: ["orders"] });
          qc.invalidateQueries({ queryKey: ["dashboard"] });

          const notif: RealtimeNotification = {
            id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            type: "order_updated",
            trackingId: String(record["tracking_id"] ?? ""),
            customerName: String(record["customer_name"] ?? ""),
            status: String(record["status"] ?? ""),
            at: Date.now(),
            read: false,
          };
          setNotifications((prev) => [notif, ...prev].slice(0, MAX_NOTIFICATIONS));
        } catch {
          /* ignore malformed */
        }
      });

      es.onerror = () => {
        setConnected(false);
        es?.close();
        if (!destroyed) {
          reconnectTimer = setTimeout(connect, 5_000);
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      es?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      setConnected(false);
    };
  }, [role, token, qc]);

  // When the user logs out, clear stored notifications so a different staff
  // member signing in on the same browser doesn't see the previous user's list.
  useEffect(() => {
    if (role !== "admin" && role !== "sales") {
      setNotifications([]);
    }
  }, [role]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = useMemo<RealtimeOrdersContextValue>(
    () => ({ notifications, unreadCount, markAllRead, connected }),
    [notifications, unreadCount, markAllRead, connected],
  );

  return (
    <RealtimeOrdersContext.Provider value={value}>
      {children}
    </RealtimeOrdersContext.Provider>
  );
}

export function useRealtimeOrdersContext(): RealtimeOrdersContextValue {
  const ctx = useContext(RealtimeOrdersContext);
  if (!ctx) {
    // Allow components rendered outside the provider (e.g. on storefront
    // pages) to render gracefully — they'll just see no notifications.
    return { notifications: [], unreadCount: 0, markAllRead: () => {}, connected: false };
  }
  return ctx;
}
