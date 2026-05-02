import { Router, type Request, type Response } from "express";
import { getSupabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";

const router = Router();

interface SseClient {
  id: string;
  res: Response;
}

const clients = new Set<SseClient>();

function broadcast(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const dead: SseClient[] = [];
  clients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      dead.push(client);
    }
  });
  dead.forEach((c) => clients.delete(c));
}

let channelReady = false;

function startRealtime() {
  if (channelReady) return;
  const sb = getSupabase();
  if (!sb) {
    logger.warn("Supabase not available — realtime disabled");
    return;
  }
  channelReady = true;

  sb.channel("orders-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      (payload) => {
        logger.info({ trackingId: (payload.new as any)?.tracking_id }, "Realtime: new order");
        broadcast("order:new", payload.new);
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "orders" },
      (payload) => {
        logger.info({ trackingId: (payload.new as any)?.tracking_id, status: (payload.new as any)?.status }, "Realtime: order updated");
        broadcast("order:updated", { record: payload.new, old: payload.old });
      }
    )
    .subscribe((status, err) => {
      if (err) {
        logger.error({ err }, "Realtime subscription error");
        channelReady = false;
      } else {
        logger.info({ status }, "Realtime channel status");
      }
    });
}

router.get("/realtime/orders", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const client: SseClient = {
    id: `sse-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    res,
  };
  clients.add(client);
  logger.info({ clientId: client.id, total: clients.size }, "SSE client connected");

  startRealtime();

  // Send initial connected event
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId: client.id, ts: Date.now() })}\n\n`);

  // Heartbeat every 20s to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch {
      clearInterval(heartbeat);
      clients.delete(client);
    }
  }, 20_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(client);
    logger.info({ clientId: client.id, remaining: clients.size }, "SSE client disconnected");
  });
});

export default router;
