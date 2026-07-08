import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AccountSkeleton } from "@/components/marketplace/skeletons";
import { ButtonLoading } from "@/components/ui/spinner";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Your account — NoBS Market" }] }),
  component: AccountPage,
});

const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year

async function signedUrlFor(path: string) {
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, SIGNED_URL_TTL);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

function AccountPage() {
  const loadProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateMyProfile);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile().then((p) => {
      setDisplayName(p?.display_name ?? "");
      setAvatarUrl(p?.avatar_url ?? "");
      setLoading(false);
    });
  }, [loadProfile]);

  async function onPickFile(file: File) {
    setUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Not signed in");

      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/jpeg",
        initialQuality: 0.8,
      });

      const path = `${uid}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, compressed, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw new Error(upErr.message);

      const url = await signedUrlFor(path);
      setAvatarUrl(url);
      await saveProfile({ data: { display_name: displayName || "You", avatar_url: url } });
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <AccountSkeleton />
        </main>
        <Footer />
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Your account</h1>

        <section className="mt-6 flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback>{(displayName || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Upload new avatar"}
            </Button>
            <p className="text-xs text-muted-foreground">JPG or PNG. Resized to 1600px automatically.</p>
          </div>
        </section>

        <form
          className="mt-8 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              await saveProfile({ data: { display_name: displayName, avatar_url: avatarUrl } });
              toast.success("Profile updated");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not save");
            } finally {
              setSaving(false);
            }
          }}
        >
          <div>
            <Label htmlFor="dn">Display name</Label>
            <Input id="dn" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
