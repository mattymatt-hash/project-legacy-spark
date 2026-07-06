import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ limit: z.number().int().min(1).max(50).default(20) })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: rows, error }, { count, error: cErr }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, type, title, body, link, read_at, created_at, meta")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(data.limit),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null),
    ]);
    if (error) throw new Error(error.message);
    if (cErr) throw new Error(cErr.message);
    return { items: rows ?? [], unread: count ?? 0 };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
