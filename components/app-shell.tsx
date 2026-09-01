import Link from "next/link";
import type { ReactNode } from "react";
import { NavLinks, type NavItem } from "@/components/nav";
import type { Participant } from "@/lib/types";

export function AppShell({
  participant,
  cohortName,
  items,
  eyebrow,
  children,
}: {
  participant: Participant;
  cohortName: string | null;
  items: NavItem[];
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <>
      <header className="border-line bg-surface border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
          <Link href="/" className="shrink-0">
            <span className="text-lg font-semibold tracking-tight">FRI Hub</span>
            {eyebrow ? (
              <span className="text-accent ml-2 text-xs font-semibold tracking-widest uppercase">
                {eyebrow}
              </span>
            ) : null}
          </Link>

          <div className="order-3 w-full md:order-2 md:w-auto md:flex-1">
            <NavLinks items={items} />
          </div>

          <div className="order-2 ml-auto flex items-center gap-3 md:order-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{participant.full_name}</p>
              <p className="text-muted text-xs">
                {cohortName ?? "No cohort"}
                {participant.status === "alumni" ? " · Alumni" : ""}
              </p>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-muted hover:text-ink text-xs underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>

      <footer className="border-line text-muted border-t px-6 py-6 text-center text-xs">
        Future Retail Incubator · E-commerce Park of Scandinavia ·{" "}
        <a className="underline" href="mailto:info@ecommercepark.se">
          info@ecommercepark.se
        </a>
      </footer>
    </>
  );
}
