import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Saffan Collection" },
      { name: "description", content: "The story behind Saffan Collection, a women's salwar kameez boutique in Mira Road." },
      { property: "og:title", content: "About — Saffan Collection" },
      { property: "og:description", content: "The story behind Saffan Collection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <div className="max-w-3xl mx-auto px-5 py-24 text-center">
      <p className="eyebrow text-gold">Our story</p>
      <h1 className="font-display text-5xl md:text-6xl mt-4">Fashion with intention</h1>
      <p className="mt-8 text-muted-foreground leading-relaxed">
        Saffan Collection is a boutique dedicated to women's salwar kameez suits — from breathable everyday cotton to festive party wear — curated for the women of Mira Road and beyond.
      </p>
      <p className="mt-4 text-sm text-muted-foreground italic">(Placeholder — share your story and we'll add it here.)</p>
      <Link to="/shop" className="mt-12 inline-block eyebrow bg-ink text-ivory px-8 py-4 hover:bg-gold hover:text-ink transition-colors">Explore the collection</Link>
    </div>
  ),
});
