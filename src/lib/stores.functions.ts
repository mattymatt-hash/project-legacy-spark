import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/, "Use lowercase letters, numbers, and hyphens.");

const createStoreSchema = z.object({
  handle: handleSchema,
  name: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
});

export const createMyStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createStoreSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("stores")
      .insert({
        owner_id: userId,
        handle: data.handle,
        name: data.name,
        bio: data.bio || null,
      })
      .select("id, handle, name")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getMyStore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const getStoreByHandle = createServerFn({ method: "GET" })
  .inputValidator((input: { handle: string }) => ({
    handle: handleSchema.parse(input.handle),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store, error } = await supabaseAdmin
      .from("stores")
      .select("id, handle, name, bio, logo_url, banner_url, rating_avg, rating_count, created_at")
      .eq("handle", data.handle)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return store;
  });
