import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function PageHeader({
  title,
  lead,
  action,
}: {
  title: string;
  lead?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="border-line mb-8 flex flex-wrap items-end justify-between gap-4 border-b pb-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {lead ? <p className="text-muted mt-1 text-sm">{lead}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-line bg-surface rounded-lg border p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-muted mb-3 text-xs font-semibold tracking-widest uppercase">
      {children}
    </h2>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="border-line text-muted rounded-lg border border-dashed px-5 py-10 text-center text-sm">
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
}) {
  const tones = {
    neutral: "bg-paper text-muted border-line",
    accent: "bg-accent-soft text-accent border-accent/25",
  };
  return (
    <span
      className={`inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/* Matches the site's call-to-action: square, generous padding, semibold,
   slightly open letter-spacing. */
const buttonBase =
  "inline-flex items-center justify-center px-8 py-[15px] text-base font-semibold tracking-[0.16px] transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const buttonTones = {
  primary: "bg-ink text-white hover:bg-accent",
  secondary: "border-ink bg-surface text-ink border hover:bg-ink hover:text-white",
  danger: "border border-red-300 bg-white text-red-700 hover:bg-red-700 hover:text-white",
};

export type ButtonTone = keyof typeof buttonTones;

export function Button({
  tone = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { tone?: ButtonTone }) {
  return (
    <button
      {...props}
      className={`${buttonBase} ${buttonTones[tone]} ${className}`}
    />
  );
}

export function ButtonLink({
  tone = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { tone?: ButtonTone }) {
  return (
    <Link {...props} className={`${buttonBase} ${buttonTones[tone]} ${className}`} />
  );
}

export function ExternalButtonLink({
  tone = "primary",
  className = "",
  ...props
}: ComponentProps<"a"> & { tone?: ButtonTone }) {
  return (
    <a
      {...props}
      target="_blank"
      rel="noreferrer noopener"
      className={`${buttonBase} ${buttonTones[tone]} ${className}`}
    />
  );
}

const fieldBase =
  "border-line bg-surface w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {hint ? <span className="text-muted mb-1 block text-xs">{hint}</span> : null}
      {children}
    </label>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input {...props} className={`${fieldBase} ${className}`} />;
}

export function Textarea({
  className = "",
  ...props
}: ComponentProps<"textarea">) {
  return <textarea {...props} className={`${fieldBase} ${className}`} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select {...props} className={`${fieldBase} ${className}`} />;
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "error" | "success";
  children: ReactNode;
}) {
  const tones = {
    info: "border-line bg-paper text-muted",
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-accent/20 bg-accent-soft text-accent",
  };
  return (
    <p className={`rounded-md border px-3 py-2 text-sm ${tones[tone]}`}>
      {children}
    </p>
  );
}
