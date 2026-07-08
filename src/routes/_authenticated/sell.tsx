import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { createMyStore, getMyStore } from "@/lib/stores.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { toast } from "sonner";
import { ConnectPayouts } from "@/components/seller/ConnectPayouts";
import { FromAddressForm } from "@/components/seller/FromAddressForm";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLoading } from "@/components/ui/spinner";

export const Route = createFileRoute("/_authenticated/sell")({
  head: () => ({ meta: [{ title: "Open your store — NoBS Market" }] }),
  component: SellPage,
});

function SellPage() {
  const navigate = useNavigate();
  const loadStore = useServerFn(getMyStore);
  const createStore = useServerFn(createMyStore);

  const [existing, setExisting] = useState<null | { handle: string; name: string }>(null);
  const [checking, setChecking] = useState(true);
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStore().then((s) => {
      if (s) setExisting({ handle: s.handle, name: s.name });
      setChecking(false);
    });
  }, [loadStore]);

  if (checking) return <Shell><p>Loading…</p></Shell>;

  if (existing) {
    return (
      <Shell>
        <h1 className="font-display text-3xl font-bold">You already have a store</h1>
        <p className="mt-2 text-muted-foreground">
          <b>{existing.name}</b> at <code>/store/{existing.handle}</code>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild><Link to="/store/$handle" params={{ handle: existing.handle }}>View storefront</Link></Button>
          <Button variant="outline" asChild><Link to="/seller">Seller dashboard</Link></Button>
        </div>
        <div className="mt-8 space-y-6">
          <ConnectPayouts />
          <FromAddressForm />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display text-3xl font-bold">Open your store</h1>
      <p className="mt-2 text-muted-foreground">Pick a handle, name your shop, and you're live. Add products next.</p>

      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try {
            const store = await createStore({ data: { handle, name, bio } });
            toast.success("Store created");
            navigate({ to: "/store/$handle", params: { handle: store.handle } });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not create store");
          } finally {
            setSaving(false);
          }
        }}
      >
        <div>
          <Label htmlFor="handle">Handle</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">nobs.market/store/</span>
            <Input
              id="handle"
              required
              minLength={3}
              maxLength={32}
              pattern="[a-z0-9][a-z0-9\-]{1,30}[a-z0-9]"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              placeholder="your-shop"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens. 3–32 characters.</p>
        </div>
        <div>
          <Label htmlFor="name">Store name</Label>
          <Input id="name" required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="bio">Bio (optional)</Label>
          <Textarea id="bio" maxLength={500} rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Open store"}</Button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10">{children}</main>
      <Footer />
    </div>
  );
}
