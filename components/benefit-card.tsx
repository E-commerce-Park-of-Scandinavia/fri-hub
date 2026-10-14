"use client";

import { useState } from "react";
import { Badge, Card } from "@/components/ui";
import { formatSessionDate } from "@/lib/format";
import type { Benefit } from "@/lib/types";

/** Clipboard can be unavailable or refused; the code is on screen either way. */
function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* leave the code visible for manual selection */
        }
      }}
      className="border-ink bg-paper hover:bg-ink inline-flex items-center gap-2 border border-dashed px-3 py-1.5 font-mono text-sm font-semibold hover:text-white"
      aria-label={`Copy discount code ${code}`}
    >
      {code}
      <span className="text-muted text-xs font-sans font-normal">
        {copied ? "copied" : "copy"}
      </span>
    </button>
  );
}

export function BenefitCard({
  benefit,
  offeredByName,
  expired = false,
  footer,
}: {
  benefit: Benefit;
  offeredByName?: string | null;
  expired?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <Card className={expired ? "opacity-60" : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {benefit.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- storage URL
            <img
              src={benefit.logo_url}
              alt=""
              className="h-12 w-12 shrink-0 object-contain"
            />
          ) : (
            <div className="bg-accent-soft text-accent flex h-12 w-12 shrink-0 items-center justify-center text-xl font-extrabold">
              {benefit.partner_name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-xl leading-tight">
              {benefit.partner_url ? (
                <a
                  href={benefit.partner_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-accent"
                >
                  {benefit.partner_name}
                </a>
              ) : (
                benefit.partner_name
              )}
            </h3>
            <p className="text-accent mt-0.5 text-base font-semibold">{benefit.title}</p>
          </div>
        </div>
        {expired ? (
          <Badge>Expired</Badge>
        ) : benefit.kind === "peer" ? (
          <Badge tone="accent">From the group</Badge>
        ) : (
          <Badge tone="accent">Partner</Badge>
        )}
      </div>

      {benefit.description ? (
        <p className="prose-plain mt-2 text-sm">{benefit.description}</p>
      ) : null}

      {offeredByName ? (
        <p className="text-muted mt-2 text-xs">Offered by {offeredByName}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {benefit.discount_code ? <CopyCode code={benefit.discount_code} /> : null}
        {benefit.redeem_url ? (
          <a
            href={benefit.redeem_url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-accent text-sm font-semibold underline"
          >
            Open the offer
          </a>
        ) : null}
      </div>

      {benefit.valid_until ? (
        <p className="text-muted mt-3 text-xs">
          {expired ? "Ended" : "Valid until"} {formatSessionDate(benefit.valid_until)}
        </p>
      ) : null}

      {footer ? <div className="border-line mt-4 border-t pt-3">{footer}</div> : null}
    </Card>
  );
}
