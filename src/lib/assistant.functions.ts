import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateChatCompletion, GatewayError } from "@lovable.dev/ai-gateway";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";

export type AssistantProduct = {
  handle: string;
  title: string;
  price: string;
  currency: string;
  compareAt: string | null;
  image: string | null;
  available: boolean;
  sizes: string[];
  colours: string[];
};

const MsgSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) });

const SYSTEM = `You are SAFFAN AI STYLE ASSISTANT for Saffan Collection, a women's salwar kameez suit boutique in Mira Road, Maharashtra, India.
- Reply in the customer's language: English, Hindi (Devanagari) or Hinglish, matching how they write.
- Be warm, concise and stylish, like a personal boutique salesperson. Use short markdown.
- To recommend or check any product ALWAYS call search_products first. Only mention products, prices, sizes, colours and availability returned by that tool. Never invent products, prices, discounts, stock or specifications.
- The products you find are shown to the customer as cards automatically; refer to them briefly by name instead of listing every detail.
- If nothing matches, say so honestly and suggest close alternatives from search results or ask a clarifying question.
- If you don't know something (delivery, alterations, store hours, phone), say the shop needs to confirm it.
- Currency is Indian Rupees (₹).`;

function toAssistantProduct(p: ShopifyProduct): AssistantProduct {
  const n = p.node;
  const v = n.variants.edges.map((e) => e.node);
  const first = v.find((x) => x.availableForSale) ?? v[0];
  const opt = (name: RegExp) => n.options.find((o) => name.test(o.name))?.values ?? [];
  return {
    handle: n.handle,
    title: n.title,
    price: first?.price.amount ?? n.priceRange.minVariantPrice.amount,
    currency: n.priceRange.minVariantPrice.currencyCode,
    compareAt: first?.compareAtPrice && Number(first.compareAtPrice.amount) > Number(first.price.amount) ? first.compareAtPrice.amount : null,
    image: n.images.edges[0]?.node.url ?? null,
    available: v.some((x) => x.availableForSale),
    sizes: opt(/size/i),
    colours: opt(/colou?r/i),
  };
}

async function searchProducts(args: { keywords?: string; max_price?: number; min_price?: number; colour?: string; size?: string; on_sale?: boolean; newest?: boolean }) {
  const parts: string[] = [];
  if (args.keywords) parts.push(args.keywords);
  if (args.min_price != null) parts.push(`variants.price:>=${args.min_price}`);
  if (args.max_price != null) parts.push(`variants.price:<=${args.max_price}`);
  let list = await fetchProducts({
    first: 20,
    query: parts.join(" ") || undefined,
    sortKey: args.newest ? "CREATED_AT" : "RELEVANCE",
    reverse: !!args.newest,
  }).catch(() => fetchProducts({ first: 20, query: parts.join(" ") || undefined }));
  // broaden if keyword search was too strict
  if (list.length === 0 && args.keywords) list = await fetchProducts({ first: 20 });
  let out = list.map(toAssistantProduct);
  if (args.max_price != null) out = out.filter((p) => Number(p.price) <= args.max_price!);
  if (args.min_price != null) out = out.filter((p) => Number(p.price) >= args.min_price!);
  if (args.on_sale) out = out.filter((p) => p.compareAt);
  const match = (vals: string[], want?: string) => !want || vals.length === 0 || vals.some((x) => x.toLowerCase().includes(want.toLowerCase()));
  out = out.filter((p) => match(p.colours, args.colour) && match(p.sizes, args.size));
  return out.slice(0, 6);
}

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_products",
      description: "Search the real Saffan Collection catalogue. Translate Hindi/Hinglish needs into English keywords (e.g. 'shaadi' -> 'wedding party wear', 'sooti' -> 'cotton').",
      parameters: {
        type: "object",
        properties: {
          keywords: { type: "string", description: "English keywords such as fabric, style, occasion: 'cotton', 'anarkali', 'party wear'. Omit to browse all." },
          max_price: { type: "number", description: "Budget upper limit in INR" },
          min_price: { type: "number" },
          colour: { type: "string" },
          size: { type: "string" },
          on_sale: { type: "boolean", description: "Only discounted items" },
          newest: { type: "boolean", description: "Latest arrivals first" },
        },
        additionalProperties: false,
      },
    },
  },
];

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ messages: z.array(MsgSchema).min(1).max(40) }).parse(input))
  .handler(async ({ data }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = [{ role: "system", content: SYSTEM }, ...data.messages];
    const found = new Map<string, AssistantProduct>();
    try {
      for (let step = 0; step < 4; step++) {
        const res = await generateChatCompletion({ model: "openai/gpt-6-astra", messages, tools: TOOLS });
        const msg = res.choices[0]?.message;
        if (!msg) break;
        const calls = msg.tool_calls ?? [];
        if (calls.length === 0) return { reply: msg.content ?? "", products: [...found.values()] };
        messages.push(msg);
        for (const c of calls) {
          if (c.type !== "function") continue;
          let result: unknown;
          try {
            const items = await searchProducts(JSON.parse(c.function.arguments || "{}"));
            items.forEach((p) => found.set(p.handle, p));
            result = items.length ? items : { note: "No products in the catalogue match. The store may not have stock listed yet." };
          } catch {
            result = { error: "Catalogue unavailable right now." };
          }
          messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(result) });
        }
      }
      return { reply: "Let me know a little more about what you're looking for.", products: [...found.values()] };
    } catch (e) {
      console.error("Assistant error", e instanceof GatewayError ? e.code : e);
      const code = e instanceof GatewayError ? e.code : "";
      return {
        reply: /rate/i.test(String(code))
          ? "I'm getting a lot of questions right now — please try again in a moment."
          : "Sorry, I couldn't respond just now. Please try again.",
        products: [],
        error: true,
      };
    }
  });
