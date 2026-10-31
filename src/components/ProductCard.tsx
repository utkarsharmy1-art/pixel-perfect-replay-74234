import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice, type ShopifyProduct } from "@/lib/shopify";

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const p = product.node;
  const variant = p.variants.edges.find((v) => v.node.availableForSale)?.node ?? p.variants.edges[0]?.node;
  const img = p.images.edges[0]?.node;
  const img2 = p.images.edges[1]?.node;
  const price = p.priceRange.minVariantPrice;
  const compare = variant?.compareAtPrice;
  const onSale = compare && Number(compare.amount) > Number(variant!.price.amount);
  const soldOut = !p.variants.edges.some((v) => v.node.availableForSale);

  const add = async () => {
    if (!variant) return;
    await addItem({ product, variantId: variant.id, variantTitle: variant.title, price: variant.price, quantity: 1, selectedOptions: variant.selectedOptions });
    toast.success("Added to bag", { description: p.title, position: "top-center" });
  };

  return (
    <div className="group">
      <Link to="/product/$handle" params={{ handle: p.handle }} className="block relative aspect-[3/4] overflow-hidden bg-secondary">
        {img && <img src={img.url} alt={img.altText ?? p.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
        {img2 && <img src={img2.url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" />}
        {soldOut && <span className="absolute top-3 left-3 bg-ink text-ivory eyebrow px-2 py-1">Sold out</span>}
        {onSale && !soldOut && <span className="absolute top-3 left-3 bg-gold text-ink eyebrow px-2 py-1">Sale</span>}
      </Link>
      <div className="pt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/product/$handle" params={{ handle: p.handle }} className="font-display text-lg leading-tight hover:text-gold transition-colors line-clamp-1">
            {p.title}
          </Link>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.description}</p>
          <p className="text-sm mt-1">
            {formatPrice(price.amount, price.currencyCode)}
            {onSale && <span className="ml-2 text-muted-foreground line-through">{formatPrice(compare!.amount, compare!.currencyCode)}</span>}
          </p>
        </div>
        <button onClick={add} disabled={isLoading || soldOut || !variant} className="eyebrow border border-ink px-3 py-2 hover:bg-ink hover:text-ivory transition-colors disabled:opacity-40 shrink-0">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
        </button>
      </div>
    </div>
  );
}

export function ProductGrid({ products, loading }: { products: ShopifyProduct[]; loading?: boolean }) {
  if (loading)
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] bg-secondary animate-pulse" />)}
      </div>
    );
  if (products.length === 0)
    return <div className="py-20 text-center border border-dashed"><p className="font-display text-2xl">No products found</p><p className="text-sm text-muted-foreground mt-2">New pieces are coming soon.</p></div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
      {products.map((p) => <ProductCard key={p.node.id} product={p} />)}
    </div>
  );
}
