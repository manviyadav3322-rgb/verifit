import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { auditLogs } from "@/db/schema";

export async function recordAudit(actorUserId: string, action: string, entityType: string, entityId: string | null = null, details?: Record<string, unknown>) {
  await db.insert(auditLogs).values({
    id: randomUUID(),
    actorUserId,
    action: action.slice(0, 120),
    entityType: entityType.slice(0, 80),
    entityId,
    details: details ?? null,
  });
}
