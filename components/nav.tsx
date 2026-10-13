"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 px-3 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? "border-accent text-accent"
                : "hover:text-ink border-transparent text-muted hover:border-line"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
