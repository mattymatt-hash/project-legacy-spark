import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className, size = 14 }: { className?: string; size?: number }) {
  return <Loader2 aria-hidden className={cn("animate-spin", className)} size={size} />;
}

/** Inline spinner + label pair for buttons in a loading state. */
export function ButtonLoading({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Spinner />
      {label}
    </span>
  );
}
