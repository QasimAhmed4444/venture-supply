import type { Request, Response, NextFunction } from "express";
import { getSupabase } from "../lib/supabase.js";

export function auditLog(action: string, entity: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = (req as any).session;
    res.on("finish", () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      const sb = getSupabase();
      if (!sb) return;
      sb.from("audit_log").insert({
        actor_id: session?.sub ?? null,
        actor_role: session?.role ?? null,
        action,
        entity,
        entity_id: req.params.id ?? (res as any).locals?.createdId ?? null,
        before: (res as any).locals?.before ?? null,
        after: req.body ?? null,
        ip: req.ip,
        user_agent: req.headers["user-agent"] as string | undefined,
      }).then(({ error }) => {
        if (error) console.error("audit_log insert failed:", error.message);
      });
    });
    next();
  };
}
