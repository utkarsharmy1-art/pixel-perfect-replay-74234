import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="bg-ink text-ivory text-center eyebrow py-2.5">New arrivals · Latest collections · Mira Road</div>
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <nav className="hidden md:flex gap-8">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="eyebrow hover:text-gold transition-colors" activeProps={{ className: "text-gold" }} activeOptions={{ exact: true }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link to="/" className="font-display text-xl md:text-2xl tracking-[0.25em] absolute left-1/2 -translate-x-1/2">
            SAFFAN<span className="text-gold"> · </span>COLLECTION
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/shop" aria-label="Search" className="p-2 hover:text-gold"><Search className="h-5 w-5" strokeWidth={1.4} /></Link>
            <CartDrawer />
          </div>
        </div>
        {open && (
          <nav className="md:hidden border-t px-5 py-4 flex flex-col gap-4">
            {NAV.map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="eyebrow">{n.label}</Link>)}
          </nav>
        )}
      </header>
    </>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-ivory mt-24">
      <div className="max-w-7xl mx-auto px-5 py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-3xl tracking-[0.2em]">SAFFAN COLLECTION</p>
          <p className="mt-4 text-sm opacity-70 max-w-sm">Premium fashion for men and women, curated in Mira Road, Maharashtra.</p>
        </div>
        <div className="text-sm space-y-2 opacity-80">
          <p className="eyebrow text-gold mb-3">Visit</p>
          <p>Mira Road, Maharashtra, India</p>
          <p className="opacity-60">Full address — to be added</p>
          <p className="opacity-60">Phone / WhatsApp — to be added</p>
        </div>
        <div className="text-sm space-y-2">
          <p className="eyebrow text-gold mb-3">Explore</p>
          {NAV.map((n) => <Link key={n.to} to={n.to} className="block opacity-80 hover:text-gold">{n.label}</Link>)}
        </div>
      </div>
      <div className="border-t border-ivory/10 text-center eyebrow py-5 opacity-50">© {new Date().getFullYear()} Saffan Collection</div>
    </footer>
  );
}
