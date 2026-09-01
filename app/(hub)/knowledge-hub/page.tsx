import Link from "next/link";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { getKnowledgeHubItems, requireParticipant } from "@/lib/data";
import { formatSessionDate } from "@/lib/format";
import {
  KNOWLEDGE_CATEGORY_LABELS,
  type KnowledgeCategory,
} from "@/lib/types";

const CATEGORIES = Object.keys(KNOWLEDGE_CATEGORY_LABELS) as KnowledgeCategory[];

export default async function KnowledgeHubPage({
  searchParams,
}: PageProps<"/knowledge-hub">) {
  await requireParticipant();
  const params = await searchParams;
  const active =
    typeof params.category === "string" &&
    CATEGORIES.includes(params.category as KnowledgeCategory)
      ? (params.category as KnowledgeCategory)
      : null;

  const all = await getKnowledgeHubItems();
  const items = active ? all.filter((i) => i.category === active) : all;

  return (
    <>
      <PageHeader
        title="Knowledge Hub"
        lead="Slides, briefs and summaries. Everything opens in Google Drive."
      />

      <nav className="mb-6 flex flex-wrap gap-2">
        <FilterLink label="All" href="/knowledge-hub" active={active === null} />
        {CATEGORIES.map((category) => (
          <FilterLink
            key={category}
            label={KNOWLEDGE_CATEGORY_LABELS[category]}
            href={`/knowledge-hub?category=${category}`}
            active={active === category}
          />
        ))}
      </nav>

      {items.length === 0 ? (
        <EmptyState>
          {active
            ? "Nothing in this category yet."
            : "Nothing has been added to the Knowledge Hub yet."}
        </EmptyState>
      ) : (
        <ul className="border-line bg-surface divide-line divide-y rounded-lg border">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.drive_url}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:bg-paper flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <span>
                  <span className="block text-sm font-medium">{item.title}</span>
                  {item.item_date ? (
                    <span className="text-muted block text-xs">
                      {formatSessionDate(item.item_date)}
                    </span>
                  ) : null}
                </span>
                <span className="flex items-center gap-2">
                  {item.cohort_id === null ? <Badge>All cohorts</Badge> : null}
                  <Badge tone="accent">
                    {KNOWLEDGE_CATEGORY_LABELS[item.category]}
                  </Badge>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function FilterLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-accent bg-accent text-white"
          : "border-line bg-surface text-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
