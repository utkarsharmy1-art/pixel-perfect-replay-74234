import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { ArrowUp, Loader2, X, RotateCcw } from "lucide-react";
import { askAssistant, type AssistantProduct } from "@/lib/assistant.functions";
import { formatPrice } from "@/lib/shopify";

type Msg = { role: "user" | "assistant"; content: string; products?: AssistantProduct[] };
const KEY = "saffan-assistant-chat";
const WELCOME: Msg = {
  role: "assistant",
  content: "Hello! Welcome to **Saffan Collection**. I'm your personal suit stylist. What are you looking for today — a cotton daily-wear suit, something for a wedding, or a gift?",
};
const SUGGESTIONS = ["Mujhe ₹1500 ke andar cotton suit chahiye", "Wedding ke liye party wear suit", "Show me your latest arrivals", "Any suits on sale?"];

function Monogram({ className = "" }: { className?: string }) {
  return <span className={`font-display italic leading-none ${className}`}>S</span>;
}

export function StyleAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setMsgs(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (msgs.length > 1) localStorage.setItem(KEY, JSON.stringify(msgs.slice(-40)));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);
  useEffect(() => {
    if (open && !busy) inputRef.current?.focus();
  }, [open, busy]);

  const send = async (content: string) => {
    const t = content.trim();
    if (!t || busy) return;
    const next = [...msgs, { role: "user" as const, content: t }];
    setMsgs(next);
    setText("");
    setBusy(true);
    try {
      const res = await askAssistant({ data: { messages: next.slice(-20).map(({ role, content }) => ({ role, content })) } });
      setMsgs([...next, { role: "assistant", content: res.reply, products: res.products }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Sorry, I couldn't respond just now. Please try again." }]);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    localStorage.removeItem(KEY);
    setMsgs([WELCOME]);
  };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Open style assistant" className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-ink text-ivory pl-2 pr-5 py-2 rounded-full shadow-2xl hover:bg-gold hover:text-ink transition-colors group">
          <span className="h-10 w-10 rounded-full bg-gold text-ink flex items-center justify-center text-2xl group-hover:bg-ink group-hover:text-gold transition-colors"><Monogram /></span>
          <span className="eyebrow">Style assistant</span>
        </button>
      )}
      {open && (
        <div className="fixed z-50 inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[400px] sm:h-[620px] sm:max-h-[calc(100vh-2.5rem)] flex flex-col bg-background sm:border shadow-2xl animate-rise">
          <div className="bg-ink text-ivory px-4 py-3 flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-gold text-ink flex items-center justify-center text-xl"><Monogram /></span>
            <div className="flex-1">
              <p className="font-display text-lg leading-none">Saffan AI Style Assistant</p>
              <p className="text-[11px] opacity-60 mt-1">English · हिंदी · Hinglish</p>
            </div>
            <button onClick={reset} aria-label="New conversation" className="p-2 opacity-70 hover:opacity-100"><RotateCcw className="h-4 w-4" /></button>
            <button onClick={() => setOpen(false)} aria-label="Close" className="p-2 opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end"><div className="bg-ink text-ivory px-4 py-2.5 max-w-[85%] text-sm rounded-2xl rounded-br-sm">{m.content}</div></div>
              ) : (
                <div key={i} className="space-y-3">
                  <div className="text-sm leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-medium">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                  {m.products && m.products.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                      {m.products.map((p) => (
                        <div key={p.handle} className="w-40 shrink-0 border bg-card">
                          <div className="aspect-[3/4] bg-secondary">{p.image && <img src={p.image} alt={p.title} loading="lazy" className="w-full h-full object-cover" />}</div>
                          <div className="p-2.5">
                            <p className="font-display text-base leading-tight line-clamp-2">{p.title}</p>
                            <p className="text-xs mt-1">
                              {formatPrice(p.price, p.currency)}
                              {p.compareAt && <span className="ml-1.5 line-through text-muted-foreground">{formatPrice(p.compareAt, p.currency)}</span>}
                            </p>
                            {!p.available && <p className="text-[10px] text-destructive mt-1">Currently sold out</p>}
                            <Link to="/product/$handle" params={{ handle: p.handle }} onClick={() => setOpen(false)} className="mt-2 block text-center eyebrow border border-ink py-1.5 hover:bg-ink hover:text-ivory transition-colors">View product</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
            {msgs.length === 1 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="text-xs border px-3 py-1.5 rounded-full hover:border-gold hover:text-gold transition-colors">{s}</button>)}
              </div>
            )}
            {busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Finding the perfect suit…</div>}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="border-t p-3 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
              rows={1}
              placeholder="Ask about suits, sizes, budget…"
              className="flex-1 resize-none bg-transparent outline-none text-sm py-2 max-h-32"
              aria-label="Message"
            />
            <button type="submit" disabled={busy || !text.trim()} aria-label="Send" className="h-9 w-9 shrink-0 rounded-full bg-ink text-ivory flex items-center justify-center disabled:opacity-30 hover:bg-gold hover:text-ink transition-colors">
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
