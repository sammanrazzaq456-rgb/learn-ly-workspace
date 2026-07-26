import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";

import emptyIllustration from "@/assets/empty-documents.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Friendly empty placeholder with the Lumen illustration. */
export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
  compact,
  illustration = true,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  compact?: boolean;
  illustration?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center",
        compact ? "gap-2 px-6 py-10" : "gap-3 px-6 py-14",
      )}
    >
      {illustration ? (
        <img
          src={emptyIllustration}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={816}
          height={816}
          className={compact ? "h-20 w-20 opacity-90" : "h-32 w-32 opacity-90"}
        />
      ) : Icon ? (
        <Icon className="h-9 w-9 text-muted-foreground/60" />
      ) : null}
      <p className="font-display text-base font-semibold">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Retryable failure state — used for query and AI generation errors. */
export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
  extra,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  extra?: ReactNode;
}) {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        {offline ? (
          <WifiOff className="h-9 w-9 text-destructive" />
        ) : (
          <AlertTriangle className="h-9 w-9 text-destructive" />
        )}
        <p className="font-display text-base font-semibold">
          {offline ? "You're offline" : title}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {offline
            ? "Check your connection and try again — nothing has been lost."
            : (description ?? "We couldn't complete that request. Please try again.")}
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {onRetry ? (
            <Button onClick={onRetry} size="sm">
              <RefreshCw className="h-4 w-4" /> {retryLabel}
            </Button>
          ) : null}
          {extra}
        </div>
      </CardContent>
    </Card>
  );
}

/** Turns unknown thrown values into a message a person can act on. */
export function friendlyErrorMessage(error: unknown, fallback = "Something went wrong") {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!raw) return fallback;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You're offline. Check your connection and try again.";
  }
  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    return "We couldn't reach Lumen. Check your connection and try again.";
  }
  if (/rate limit|429/i.test(raw)) return "Lumen is busy right now. Try again in a moment.";
  if (/credits|402/i.test(raw)) return "AI credits are exhausted. Add credits to keep going.";
  if (/401|unauthor|jwt/i.test(raw)) return "Your session expired. Sign in again.";
  return raw;
}
