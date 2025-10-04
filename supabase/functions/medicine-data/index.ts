// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import dataset from "./dataset.json" with { type: "json" };

// Minimal CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Shape of items returned to the frontend (matching Supabase table fields used in SearchResults.tsx)
type MedicineRow = {
  id: string;
  name: string;
  generic_name?: string | null;
  manufacturer?: string | null;
  category?: string | null;
  description?: string | null;
  drug_class?: string | null;
  verified?: boolean | null;
  brand_names?: string[] | null;
};

const normalize = (v?: string | null) => (v ?? "").toLowerCase();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let searchTerm: string | undefined;
    let category: string | undefined;
    let limit = 100;

    if (req.method === "GET") {
      searchTerm = url.searchParams.get("searchTerm") ?? undefined;
      category = url.searchParams.get("category") ?? undefined;
      const limitParam = url.searchParams.get("limit");
      if (limitParam) limit = Math.min(500, Math.max(1, parseInt(limitParam))); // safety bounds
    } else {
      const body = (await req.json().catch(() => ({}))) as {
        searchTerm?: string;
        category?: string;
        limit?: number;
      };
      searchTerm = body.searchTerm;
      category = body.category;
      if (typeof body.limit === "number") {
        limit = Math.min(500, Math.max(1, body.limit));
      }
    }

    const q = normalize(searchTerm);
    const cat = normalize(category);

    // Filter dataset
    let items = (dataset as MedicineRow[]).filter((d) => {
      // category filter if provided
      const categoryOk = cat ? normalize(d.category) === cat : true;

      if (!q) return categoryOk;

      const hay = [
        normalize(d.name),
        normalize(d.generic_name),
        normalize(d.manufacturer),
        normalize(d.category),
        normalize(d.description),
        normalize(d.drug_class),
        (d.brand_names || []).map((b) => b.toLowerCase()).join(" "),
      ].join(" ");

      return categoryOk && hay.includes(q);
    });

    if (items.length > limit) items = items.slice(0, limit);

    return new Response(JSON.stringify(items), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    });
  }
});