import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchProduct, formatPrice } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

export const Route = createFileRoute("/product/$handle")({
  head: () => ({
    meta: [
      { title: "Product — Saffan Collection" },
      { name: "description", content: "View product details at Saffan Collection." },
      { property: "og:title", content: "Product — Saffan Collection" },
      { property: "og:description", content: "View product details at Saffan Collection." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const { data: product, isLoading } = useQuery({ queryKey: ["product", handle], queryFn: () => fetchProduct(handle) });
  const addItem = useCartStore((s) => s.addItem);
  const cartLoading = useCartStore((s) => s.isLoading);
  const [sel, setSel] = useState<Record<string, string>>({});
  const [imgIdx, setImgIdx] = useState(0);

  const variant = useMemo(() => {
    if (!product) return undefined;
    const vs = product.node.variants.edges.map((e) => e.node);
    return vs.find((v) => v.selectedOptions.every((o) => (sel[o.name] ?? vs[0].selectedOptions.find((x) => x.name === o.name)?.value) === o.value)) ?? vs[0];
  }, [product, sel]);

  if (isLoading) return <div className="py-40 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!product)
    return <div className="py-40 text-center"><p className="font-display text-3xl">Product not found</p><Link to="/shop" className="eyebrow underline mt-4 inline-block">Back to shop</Link></div>;

  const p = product.node;
  const images = p.images.edges.map((e) => e.node);
  const onSale = variant?.compareAtPrice && Number(variant.compareAtPrice.amount) > Number(variant.price.amount);
  const options = p.options.filter((o) => !(o.values.length === 1 && o.values[0] === "Default Title"));

  const add = async () => {
    if (!variant) return;
    await addItem({ product, variantId: variant.id, variantTitle: variant.title, price: variant.price, quantity: 1, selectedOptions: variant.selectedOptions });
    toast.success("Added to bag", { description: p.title, position: "top-center" });
  };

  return (
    <div className="max-w-7xl mx-auto px-5 py-12 grid md:grid-cols-2 gap-12">
      <div>
        <div className="aspect-[3/4] bg-secondary overflow-hidden">
          {images[imgIdx] && <img src={images[imgIdx].url} alt={images[imgIdx].altText ?? p.title} className="w-full h-full object-cover" />}
        </div>
        {images.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-3">
            {images.map((im, i) => (
              <button key={im.url} onClick={() => setImgIdx(i)} className={`aspect-square overflow-hidden border ${i === imgIdx ? "border-ink" : "border-transparent"}`} aria-label={`Image ${i + 1}`}>
                <img src={im.url} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="md:pt-8">
        {p.productType && <p className="eyebrow text-gold">{p.productType}</p>}
        <h1 className="font-display text-4xl md:text-5xl mt-2">{p.title}</h1>
        {variant && (
          <p className="text-xl mt-4">
            {formatPrice(variant.price.amount, variant.price.currencyCode)}
            {onSale && <span className="ml-3 text-muted-foreground line-through text-base">{formatPrice(variant.compareAtPrice!.amount, variant.compareAtPrice!.currencyCode)}</span>}
          </p>
        )}
        <p className="mt-6 text-muted-foreground leading-relaxed">{p.description}</p>
        {options.map((o) => (
          <div key={o.name} className="mt-8">
            <p className="eyebrow mb-3">{o.name}</p>
            <div className="flex flex-wrap gap-2">
              {o.values.map((v) => {
                const active = (sel[o.name] ?? variant?.selectedOptions.find((x) => x.name === o.name)?.value) === v;
                return (
                  <button key={v} onClick={() => setSel({ ...sel, [o.name]: v })} className={`min-w-12 px-4 py-2 text-sm border transition-colors ${active ? "bg-ink text-ivory border-ink" : "hover:border-ink"}`}>
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <button onClick={add} disabled={cartLoading || !variant?.availableForSale} className="mt-10 w-full h-14 eyebrow bg-ink text-ivory hover:bg-gold hover:text-ink transition-colors disabled:opacity-40 flex items-center justify-center">
          {cartLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : variant?.availableForSale ? "Add to bag" : "Sold out"}
        </button>
      </div>
    </div>
  );
}
