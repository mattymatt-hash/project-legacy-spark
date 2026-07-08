import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ButtonLoading } from "@/components/ui/spinner";
import { StarInput } from "@/components/marketplace/StarRating";
import { submitReview } from "@/lib/reviews.functions";

export function ReviewDialog({
  open,
  onOpenChange,
  orderId,
  listingId,
  itemTitle,
  initialRating = 0,
  initialBody = "",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  listingId: string;
  itemTitle: string;
  initialRating?: number;
  initialBody?: string;
}) {
  const submit = useServerFn(submitReview);
  const qc = useQueryClient();
  const [rating, setRating] = useState(initialRating);
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);

  async function onSubmit() {
    if (rating < 1) {
      toast.error("Pick a star rating");
      return;
    }
    setSaving(true);
    try {
      await submit({ data: { order_id: orderId, listing_id: listingId, rating, body: body.trim() || null } });
      toast.success("Review submitted");
      qc.invalidateQueries({ queryKey: ["reviewable-items"] });
      qc.invalidateQueries({ queryKey: ["listing-reviews", listingId] });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review your purchase</DialogTitle>
          <DialogDescription className="truncate">{itemTitle}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <p className="mb-2 text-sm font-medium">Your rating</p>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Comments (optional)</p>
            <Textarea
              rows={4}
              maxLength={2000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="How was the item? How was shipping? Any tips for other buyers?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? <ButtonLoading label="Submitting…" /> : "Submit review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
