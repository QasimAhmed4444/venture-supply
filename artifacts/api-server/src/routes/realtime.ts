import { Router, type Request, type Response } from "express";
import { getSupabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import { verifySessionToken } from "../lib/sessionToken.js";

const router = Router();

interface SseClient {
  id: string;
  res: Response;
  role: "admin" | "sales" | "b2c" | "b2b";
  // For "sales" — only receive orders matching this salesperson.
  salespersonId: string | null;
  // For "b2c"/"b2b" — only receive orders matching this customer.
  customerId: string | null;
}

const clients = new Set<SseClient>();

function shouldDeliver(client: SseClient, record: Record<string, unknown>): boolean {
  if (client.role === "admin") return true;
  if (client.role === "sales") {
    return client.salespersonId != null && record["salesperson_id"] === client.salespersonId;
  }
  // b2c / b2b — strictly scoped to the authenticated customer's own orders
  return client.customerId != null && record["customer_id"] === client.customerId;
}

function broadcast(event: string, record: Record<string, unknown>, extra?: Record<string, unknown>) {
  const dead: SseClient[] = [];
  clients.forEach((client) => {
    if (!shouldDeliver(client, record)) return;
    const data = extra ? { record, ...extra } : record;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
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
        const rec = payload.new as Record<string, unknown>;
        logger.info({ trackingId: rec?.["tracking_id"] }, "Realtime: new order");
        broadcast("order:new", rec);
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "orders" },
      (payload) => {
        const rec = payload.new as Record<string, unknown>;
        const old = payload.old as Record<string, unknown>;
        logger.info(
          { trackingId: rec?.["tracking_id"], status: rec?.["status"] },
          "Realtime: order updated",
        );
        broadcast("order:updated", rec, { old });
      },
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

router.get("/realtime/orders", async (req: Request, res: Response) => {
  // EventSource cannot send custom headers, so the session token is passed
  // as a query parameter. Validate it the same way as the Authorization
  // bearer flow used by the rest of the API.
  const token = typeof req.query["token"] === "string" ? (req.query["token"] as string) : null;
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const session = verifySessionToken(token);
  if (!session) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }
  const role = session.role;
  if (role !== "admin" && role !== "sales" && role !== "b2c" && role !== "b2b") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // Resolve the per-client scope (salesperson for sales, customer for b2c/b2b).
  let salespersonId: string | null = null;
  let customerId: string | null = null;
  const sb = getSupabase();
  if (role === "sales") {
    if (sb) {
      try {
        const { data } = await sb
          .from("staff")
          .select("salesperson_id")
          .eq("id", session.sub)
          .maybeSingle();
        salespersonId = (data?.salesperson_id as string | null | undefined) ?? null;
      } catch {
        salespersonId = null;
      }
    }
    if (!salespersonId) {
      res.status(403).json({ error: "Sales account is not linked to a salesperson record" });
      return;
    }
  } else if (role === "b2c" || role === "b2b") {
    if (sb) {
      try {
        const { data } = await sb
          .from("customers")
          .select("id")
          .eq("email", session.email)
          .maybeSingle();
        customerId = (data?.id as string | null | undefined) ?? null;
      } catch {
        customerId = null;
      }
    }
    if (!customerId) {
      res.status(403).json({ error: "Customer account not found" });
      return;
    }
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const client: SseClient = {
    id: `sse-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    res,
    role,
    salespersonId,
    customerId,
  };
  clients.add(client);
  logger.info(
    { clientId: client.id, role: client.role, salespersonId, customerId, total: clients.size },
    "SSE client connected",
  );

  startRealtime();

  res.write(
    `event: connected\ndata: ${JSON.stringify({ clientId: client.id, role: client.role, ts: Date.now() })}\n\n`,
  );

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
    logger.info(
      { clientId: client.id, remaining: clients.size },
      "SSE client disconnected",
    );
  });
});

export default router;
