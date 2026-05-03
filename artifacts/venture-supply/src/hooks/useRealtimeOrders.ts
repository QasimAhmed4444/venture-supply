import { useEffect, useRef } from "react";
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

export function useRealtimeOrders(
  onNotification: (n: RealtimeNotification) => void,
  filter?: (record: Record<string, unknown>) => boolean,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;
  const qc = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { soundEnabled, playChime } = useNotificationPreferences();
  const { role } = useRole();
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;
  const filterRef = useRef(filter);
  filterRef.current = filter;
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const playChimeRef = useRef(playChime);
  playChimeRef.current = playChime;

  const token = enabled && role !== "guest" ? getSessionToken() : null;

  useEffect(() => {
    if (!enabled || !token) return;
    const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
    let destroyed = false;

    function connect() {
      if (destroyed) return;
      const es = new EventSource(`${BASE}/api/realtime/orders?token=${encodeURIComponent(token!)}`);
      esRef.current = es;

      es.addEventListener("connected", () => {
        if (reconnectRef.current) {
          clearTimeout(reconnectRef.current);
          reconnectRef.current = null;
        }
      });

      es.addEventListener("order:new", (event: MessageEvent) => {
        try {
          const record = JSON.parse(event.data) as Record<string, unknown>;
          if (filterRef.current && !filterRef.current(record)) return;

          qc.invalidateQueries({ queryKey: ["orders"] });
          qc.invalidateQueries({ queryKey: ["dashboard"] });

          const notif: RealtimeNotification = {
            id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            type: "new_order",
            trackingId: String(record.tracking_id ?? ""),
            customerName: String(record.customer_name ?? ""),
            at: Date.now(),
            read: false,
          };
          onNotificationRef.current(notif);

          if (soundEnabledRef.current) playChimeRef.current();

          toast({
            title: language === "ar" ? "🛒 طلب جديد!" : "🛒 New Order!",
            description: `${record.tracking_id} · ${record.customer_name}`,
          });
        } catch { /* ignore malformed */ }
      });

      es.addEventListener("order:updated", (event: MessageEvent) => {
        try {
          const { record } = JSON.parse(event.data) as {
            record: Record<string, unknown>;
            old: Record<string, unknown>;
          };
          if (filterRef.current && !filterRef.current(record)) return;

          qc.invalidateQueries({ queryKey: ["orders"] });
          qc.invalidateQueries({ queryKey: ["dashboard"] });

          const notif: RealtimeNotification = {
            id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            type: "order_updated",
            trackingId: String(record.tracking_id ?? ""),
            customerName: String(record.customer_name ?? ""),
            status: String(record.status ?? ""),
            at: Date.now(),
            read: false,
          };
          onNotificationRef.current(notif);
        } catch { /* ignore malformed */ }
      });

      es.onerror = () => {
        es.close();
        if (!destroyed) {
          reconnectRef.current = setTimeout(connect, 5_000);
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      esRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [qc, token, enabled]);
}
