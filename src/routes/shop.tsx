import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchProducts } from "@/lib/shopify";
import { ProductGrid } from "@/components/ProductCard";

type Search = { q?: string | undefined; sort?: "best" | "new" | "price-asc" | "price-desc" | undefined };

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    sort: ["best", "new", "price-asc", "price-desc"].includes(s["sort"] as string) ? (s["sort"] as Search["sort"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop — Saffan Collection" },
      { name: "description", content: "Browse the full Saffan Collection: men's, women's, traditional and western wear." },
      { property: "og:title", content: "Shop — Saffan Collection" },
      { property: "og:description", content: "Browse the full Saffan Collection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

const SORTS = {
  best: { sortKey: "BEST_SELLING", reverse: false, label: "Popular" },
  new: { sortKey: "CREATED_AT", reverse: true, label: "Newest" },
  "price-asc": { sortKey: "PRICE", reverse: false, label: "Price: low to high" },
  "price-desc": { sortKey: "PRICE", reverse: true, label: "Price: high to low" },
} as const;

function Shop() {
  const { q, sort = "best" } = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const [text, setText] = useState(q ?? "");
  const s = SORTS[sort];
  const { data, isLoading } = useQuery({
    queryKey: ["products", q, sort],
    queryFn: () => fetchProducts({ first: 48, query: q, sortKey: s["sort"]Key, reverse: s.reverse }),
  });

  return (
    <div className="max-w-7xl mx-auto px-5 py-16">
      <p className="eyebrow text-gold">The collection</p>
      <h1 className="font-display text-5xl mt-2">{q ? `“${q}”` : "Shop all"}</h1>
      <div className="mt-8 mb-12 flex flex-col md:flex-row gap-4 md:items-center justify-between border-y py-4">
        <form onSubmit={(e) => { e.preventDefault(); navigate({ search: (p) => ({ ...p, q: text || undefined }) }); }} className="flex-1 max-w-md">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search shirts, kurtas, jeans…" className="w-full bg-transparent border-b border-ink/30 focus:border-gold outline-none py-2 text-sm" aria-label="Search products" />
        </form>
        <select value={sort} onChange={(e) => navigate({ search: (p) => ({ ...p, sort: e.target.value as Search["sort"] }) })} className="bg-transparent eyebrow outline-none" aria-label="Sort">
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <ProductGrid products={data ?? []} loading={isLoading} />
    </div>
  );
}
