import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Saffan Collection" },
      { name: "description", content: "Visit or contact Saffan Collection in Mira Road, Maharashtra." },
      { property: "og:title", content: "Contact — Saffan Collection" },
      { property: "og:description", content: "Visit or contact Saffan Collection in Mira Road." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <div className="max-w-7xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-12">
      <div>
        <p className="eyebrow text-gold">Get in touch</p>
        <h1 className="font-display text-5xl mt-3">Visit the store</h1>
        <dl className="mt-10 space-y-6 text-sm">
          <div><dt className="eyebrow mb-1">Address</dt><dd>Mira Road, Maharashtra, India <span className="text-muted-foreground">(full address to be added)</span></dd></div>
          <div><dt className="eyebrow mb-1">Phone & WhatsApp</dt><dd className="text-muted-foreground">To be added</dd></div>
          <div><dt className="eyebrow mb-1">Hours</dt><dd className="text-muted-foreground">To be added</dd></div>
        </dl>
      </div>
      <iframe title="Map of Mira Road" className="w-full min-h-[400px] border" loading="lazy" src="https://www.google.com/maps?q=Mira+Road,+Maharashtra&output=embed" />
    </div>
  ),
});
