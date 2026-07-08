import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLoading } from "@/components/ui/spinner";
import { getMyStore } from "@/lib/stores.functions";
import { updateStoreFromAddress } from "@/lib/shipping.functions";

type Addr = {
  name?: string | null;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string | null;
};

export function FromAddressForm() {
  const loadStore = useServerFn(getMyStore);
  const update = useServerFn(updateStoreFromAddress);
  const storeQ = useQuery({ queryKey: ["my-store-address"], queryFn: () => loadStore() });

  const existing = (storeQ.data?.from_address ?? null) as Addr | null;
  const [a, setA] = useState<Addr>(
    existing ?? { name: "", street1: "", street2: "", city: "", state: "", zip: "", country: "US", phone: "" },
  );
  const [saving, setSaving] = useState(false);

  if (storeQ.isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-6 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-full" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </div>
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await update({ data: a });
      toast.success("Ship-from address saved");
      storeQ.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6">
      <h3 className="font-display text-lg font-semibold">Ship-from address</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Buyers see live shipping rates calculated from this address. Required before live shipping works.
      </p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Name / Business"><Input value={a.name ?? ""} onChange={(e) => setA({ ...a, name: e.target.value })} /></Field>
        <Field label="Phone"><Input value={a.phone ?? ""} onChange={(e) => setA({ ...a, phone: e.target.value })} /></Field>
        <div className="sm:col-span-2"><Field label="Street"><Input required value={a.street1} onChange={(e) => setA({ ...a, street1: e.target.value })} /></Field></div>
        <div className="sm:col-span-2"><Field label="Street 2"><Input value={a.street2 ?? ""} onChange={(e) => setA({ ...a, street2: e.target.value })} /></Field></div>
        <Field label="City"><Input required value={a.city} onChange={(e) => setA({ ...a, city: e.target.value })} /></Field>
        <Field label="State"><Input required maxLength={2} value={a.state} onChange={(e) => setA({ ...a, state: e.target.value.toUpperCase() })} /></Field>
        <Field label="ZIP"><Input required value={a.zip} onChange={(e) => setA({ ...a, zip: e.target.value })} /></Field>
        <Field label="Country"><Input required maxLength={2} value={a.country} onChange={(e) => setA({ ...a, country: e.target.value.toUpperCase() })} /></Field>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={saving}>{saving ? <ButtonLoading label="Saving…" /> : "Save ship-from address"}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
