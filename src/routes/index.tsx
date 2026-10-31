import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import hero from "@/assets/hero.jpg";
import { fetchProducts } from "@/lib/shopify";
import { ProductGrid } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saffan Collection — Style That Defines You" },
      { name: "description", content: "Premium women's salwar kameez suits — cotton, party wear, Anarkali and more — at Saffan Collection, Mira Road." },
      { property: "og:title", content: "Saffan Collection — Style That Defines You" },
      { property: "og:description", content: "Premium women's salwar kameez suits from Mira Road." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CATEGORIES = [["Cotton Suits","cotton"],["Party Wear","party"],["Anarkali","anarkali"],["Straight Cut","straight"],["Palazzo Sets","palazzo"],["Dupattas","dupatta"]] as const;

function Index() {
  const trending = useQuery({ queryKey: ["products", "best"], queryFn: () => fetchProducts({ first: 8 }) });
  const fresh = useQuery({ queryKey: ["products", "new"], queryFn: () => fetchProducts({ first: 4, sortKey: "CREATED_AT", reverse: true }) });

  return (
    <>
      <section className="relative h-[min(85vh,720px)] min-h-[520px] overflow-hidden bg-ink">
        <img src={hero} alt="Woman in an embroidered ivory salwar kameez suit" width={1920} height={1088} className="absolute inset-0 w-full h-full object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-ivory via-ivory/70 to-transparent md:via-ivory/30" />
        <div className="relative max-w-7xl mx-auto px-5 h-full flex flex-col justify-center">
          <p className="eyebrow text-ink/70 animate-rise">Salwar Kameez · The New Collection</p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] mt-4 max-w-xl text-ink animate-rise">Style that<br />defines <em className="text-gold">you</em></h1>
          <p className="mt-6 max-w-sm text-ink/70 animate-rise">Hand-picked salwar kameez suits for every day, every festival and every celebration.</p>
          <div className="mt-10 flex flex-wrap gap-4 animate-rise">
            <Link to="/shop" className="eyebrow bg-ink text-ivory px-8 py-4 hover:bg-gold hover:text-ink transition-colors">Shop now</Link>
            <Link to="/shop" search={{ sort: "new" }} className="eyebrow border border-ink text-ink px-8 py-4 hover:bg-ink hover:text-ivory transition-colors">Explore suits</Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 py-24">
        <p className="eyebrow text-gold text-center">Shop by style</p>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border-t border-l">
          {CATEGORIES.map(([c, q]) => (
            <Link key={c} to="/shop" search={{ q }} className="border-r border-b px-4 py-10 text-center font-display text-xl hover:bg-ink hover:text-ivory transition-colors">
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5">
        <Heading eyebrow="Most loved" title="Trending now" />
        <ProductGrid products={trending.data ?? []} loading={trending.isLoading} />
      </section>

      <section className="max-w-7xl mx-auto px-5 pt-24">
        <Heading eyebrow="Just in" title="New arrivals" />
        <ProductGrid products={fresh.data ?? []} loading={fresh.isLoading} />
      </section>

      <section className="max-w-7xl mx-auto px-5 pt-24 grid md:grid-cols-3 gap-10 text-center">
        {[
          ["Curated quality", "Every suit hand-picked for fabric, fit and finish."],
          ["Local & personal", "Visit our Mira Road boutique for personal styling."],
          ["Secure checkout", "Pay safely through our protected checkout."],
        ].map(([t, d]) => (
          <div key={t} className="border-t pt-8">
            <h3 className="font-display text-2xl">{t}</h3>
            <p className="text-sm text-muted-foreground mt-2">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}

function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-end justify-between mb-10">
      <div>
        <p className="eyebrow text-gold">{eyebrow}</p>
        <h2 className="font-display text-4xl md:text-5xl mt-2">{title}</h2>
      </div>
      <Link to="/shop" className="eyebrow border-b border-ink pb-1 hover:text-gold hover:border-gold">View all</Link>
    </div>
  );
}
