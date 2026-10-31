import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBag, Minus, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/shopify";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, syncCart } = useCartStore();
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0);
  const currency = items[0]?.price.currencyCode || "INR";

  useEffect(() => {
    if (open) syncCart();
  }, [open, syncCart]);

  const checkout = () => {
    const url = getCheckoutUrl();
    if (url) {
      window.open(url, "_blank");
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button aria-label="Shopping bag" className="relative p-2 hover:text-gold transition-colors">
          <ShoppingBag className="h-5 w-5" strokeWidth={1.4} />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-gold text-ink text-[10px] flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-background">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl tracking-wide">Your Bag</SheetTitle>
          <SheetDescription>{totalItems === 0 ? "Your bag is empty" : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 min-h-0 px-4">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mb-3" strokeWidth={1} />
              Nothing here yet.
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-5 py-2">
                {items.map((item) => {
                  const img = item.product.node.images?.edges?.[0]?.node;
                  return (
                    <div key={item.variantId} className="flex gap-4">
                      <div className="w-20 h-24 bg-secondary overflow-hidden shrink-0">
                        {img && <img src={img.url} alt={item.product.node.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-lg leading-tight truncate">{item.product.node.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.selectedOptions.map((o) => o.value).join(" · ")}</p>
                        <p className="text-sm mt-1">{formatPrice(item.price.amount, item.price.currencyCode)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.variantId, item.quantity - 1)} aria-label="Decrease">
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.variantId, item.quantity + 1)} aria-label="Increase">
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => removeItem(item.variantId)} aria-label="Remove">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t py-5 space-y-4">
                <div className="flex justify-between">
                  <span className="eyebrow">Subtotal</span>
                  <span className="font-display text-xl">{formatPrice(total, currency)}</span>
                </div>
                <Button onClick={checkout} size="lg" className="w-full rounded-none eyebrow h-12" disabled={isLoading || isSyncing}>
                  {isLoading || isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4 mr-2" />Checkout</>}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
