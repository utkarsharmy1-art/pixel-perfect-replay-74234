import { toast } from "sonner";

export const SHOPIFY_API_VERSION = "2026-10";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "pixel-perfect-replica-rr12e-qg6mynhf.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "7afe4dbc5b0357b1e5527bd34580215a";

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    productType?: string;
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    compareAtPriceRange?: { minVariantPrice: { amount: string; currencyCode: string } };
    images: { edges: Array<{ node: { url: string; altText: string | null } }> };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          price: { amount: string; currencyCode: string };
          compareAtPrice?: { amount: string; currencyCode: string } | null;
          availableForSale: boolean;
          selectedOptions: Array<{ name: string; value: string }>;
        };
      }>;
    };
    options: Array<{ name: string; values: string[] }>;
  };
}

const PRODUCT_FIELDS = `
  id title description handle productType
  priceRange { minVariantPrice { amount currencyCode } }
  compareAtPriceRange { minVariantPrice { amount currencyCode } }
  images(first: 5) { edges { node { url altText } } }
  variants(first: 50) { edges { node { id title price { amount currencyCode } compareAtPrice { amount currencyCode } availableForSale selectedOptions { name value } } } }
  options { name values }
`;

export const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(first: $first, query: $query, sortKey: $sortKey, reverse: $reverse) { edges { node { ${PRODUCT_FIELDS} } } }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query GetProduct($handle: String!) { product(handle: $handle) { ${PRODUCT_FIELDS} } }
`;

export async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (response.status === 402) {
    if (typeof window !== "undefined") {
      toast.error("Shopify: Payment required", {
        description: "Shopify API access requires an active Shopify billing plan. Visit https://admin.shopify.com to upgrade.",
      });
    }
    return;
  }
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  if (data.errors) throw new Error(`Error calling Shopify: ${data.errors.map((e: { message: string }) => e.message).join(", ")}`);
  return data;
}

export async function fetchProducts(opts: { first?: number; query?: string | undefined; sortKey?: string; reverse?: boolean } = {}) {
  const data = await storefrontApiRequest(PRODUCTS_QUERY, {
    first: opts.first ?? 24,
    query: opts.query || null,
    sortKey: opts.sortKey ?? "BEST_SELLING",
    reverse: opts.reverse ?? false,
  });
  return (data?.data?.products?.edges ?? []) as ShopifyProduct[];
}

export async function fetchProduct(handle: string) {
  const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
  const p = data?.data?.product;
  return p ? ({ node: p } as ShopifyProduct) : null;
}

export function formatPrice(amount: string | number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount));
}
