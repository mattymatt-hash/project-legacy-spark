import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getConnectStatus, createConnectOnboardingLink } from "@/lib/checkout.functions";

export function ConnectPayouts() {
  const loadStatus = useServerFn(getConnectStatus);
  const startOnboarding = useServerFn(createConnectOnboardingLink);
  const [starting, setStarting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["connect-status"],
    queryFn: () => loadStatus(),
  });

  async function onConnect() {
    setStarting(true);
    try {
      const { url } = await startOnboarding();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start onboarding");
      setStarting(false);
    }
  }

  if (isLoading) {
    return <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">Loading payout status…</div>;
  }
  if (!data || !data.hasStore) return null;

  const ready = data.hasAccount && data.chargesEnabled;
  const pending = data.hasAccount && !data.chargesEnabled;

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        {ready ? (
          <CheckCircle2 className="mt-0.5 text-emerald-500" size={20} />
        ) : (
          <AlertCircle className="mt-0.5 text-amber-500" size={20} />
        )}
        <div className="flex-1">
          <h3 className="font-semibold">Payouts via Stripe</h3>
          {ready ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Connected. Buyers can purchase from your store and you'll receive payouts automatically (minus the 10% platform fee).
            </p>
          ) : pending ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Onboarding started but not finished. Complete the Stripe form to start accepting payments.
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Connect a Stripe account to accept payments. Payouts go directly to your bank. NoBS Market keeps 10% per sale.
            </p>
          )}
        </div>
        <Button onClick={onConnect} disabled={starting} variant={ready ? "outline" : "default"} size="sm">
          {starting ? "Opening…" : ready ? "Manage" : pending ? "Finish setup" : "Connect Stripe"}
          <ExternalLink size={14} />
        </Button>
      </div>
      {ready ? null : (
        <button onClick={() => refetch()} className="mt-3 text-xs text-muted-foreground hover:text-foreground">
          Refresh status
        </button>
      )}
    </div>
  );
}
