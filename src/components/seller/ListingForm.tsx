import { type ReactNode, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createListing, updateListing, deleteListing } from "@/lib/listings.functions";
import { dollarsToCents, centsToDollarString } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = ["vintage", "handmade", "home", "fashion", "art", "collectibles"] as const;
const CONDITIONS = [
  { v: "new", l: "New" },
  { v: "like_new", l: "Like new" },
  { v: "good", l: "Good" },
  { v: "vintage", l: "Vintage" },
];
const STATUSES = ["draft", "active", "archived"] as const;

export interface ListingFormInitial {
  id?: string;
  title?: string;
  description?: string;
  price_cents?: number;
  original_price_cents?: number | null;
  shipping_cents?: number;
  weight_oz?: number;
  length_in?: number | null;
  width_in?: number | null;
  height_in?: number | null;
  stock?: number;
  condition?: string;
  category?: string;
  status?: string;
  image_urls?: string[];
  tags?: string[];
}

export function ListingForm({ initial, mode }: { initial?: ListingFormInitial; mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const create = useServerFn(createListing);
  const update = useServerFn(updateListing);
  const del = useServerFn(deleteListing);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(centsToDollarString(initial?.price_cents ?? 0));
  const [originalPrice, setOriginalPrice] = useState(
    initial?.original_price_cents ? centsToDollarString(initial.original_price_cents) : "",
  );
  const [shipping, setShipping] = useState(centsToDollarString(initial?.shipping_cents ?? 0));
  const [stock, setStock] = useState(String(initial?.stock ?? 1));
  const [weight, setWeight] = useState(String(initial?.weight_oz ?? 8));
  const [lengthIn, setLengthIn] = useState(String(initial?.length_in ?? 6));
  const [widthIn, setWidthIn] = useState(String(initial?.width_in ?? 4));
  const [heightIn, setHeightIn] = useState(String(initial?.height_in ?? 2));
  const [category, setCategory] = useState(initial?.category ?? "handmade");
  const [condition, setCondition] = useState(initial?.condition ?? "new");
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [imagesText, setImagesText] = useState((initial?.image_urls ?? []).join("\n"));
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const image_urls = imagesText
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const tags = tagsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title,
        description,
        price_cents: dollarsToCents(price),
        original_price_cents: originalPrice ? dollarsToCents(originalPrice) : null,
        shipping_cents: dollarsToCents(shipping),
        stock: Number(stock) || 0,
        weight_oz: Number(weight) || 8,
        length_in: Number(lengthIn) || 6,
        width_in: Number(widthIn) || 4,
        height_in: Number(heightIn) || 2,
        category,
        condition,
        status,
        image_urls,
        tags,
      };

      if (mode === "create") {
        const row = await create({ data: payload });
        toast.success("Listing created");
        navigate({ to: "/seller" });
        void row;
      } else if (initial?.id) {
        await update({ data: { id: initial.id, ...payload } });
        toast.success("Listing updated");
        navigate({ to: "/seller" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!initial?.id) return;
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await del({ data: { id: initial.id } });
      toast.success("Deleted");
      navigate({ to: "/seller" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Title">
        <Input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Description">
        <Textarea rows={5} maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price (USD)">
          <Input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Original price (optional, for sale)">
          <Input type="number" min="0" step="0.01" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
        </Field>
        <Field label="Shipping (USD)">
          <Input type="number" min="0" step="0.01" value={shipping} onChange={(e) => setShipping(e.target.value)} />
        </Field>
        <Field label="Weight (oz)" hint="Used for live shipping rates.">
          <Input type="number" min="0" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </Field>
        <Field label="Stock">
          <Input type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} />
        </Field>
        <Field label="Length (in)">
          <Input type="number" min="0" step="0.1" value={lengthIn} onChange={(e) => setLengthIn(e.target.value)} />
        </Field>
        <Field label="Width (in)">
          <Input type="number" min="0" step="0.1" value={widthIn} onChange={(e) => setWidthIn(e.target.value)} />
        </Field>
        <Field label="Height (in)">
          <Input type="number" min="0" step="0.1" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} />
        </Field>
        <Field label="Category">
          <select
            className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Condition">
          <select
            className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            {CONDITIONS.map((c) => (
              <option key={c.v} value={c.v}>
                {c.l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Image URLs"
        hint="One URL per line. Up to 8. Paste hosted image URLs (e.g. Unsplash, Imgur). Direct upload coming soon."
      >
        <Textarea
          rows={4}
          value={imagesText}
          onChange={(e) => setImagesText(e.target.value)}
          placeholder="https://images.unsplash.com/..."
        />
      </Field>

      <Field label="Tags" hint="Comma-separated. Up to 10.">
        <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="ceramics, kitchen, gift" />
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Create listing" : "Save changes"}
        </Button>
        {mode === "edit" && (
          <Button type="button" variant="destructive" onClick={onDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        )}
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
