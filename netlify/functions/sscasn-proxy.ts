import type { Context } from "@netlify/functions";

// ===================================================
// Server-side cache untuk metadata (instansi, jabatan, pendidikan)
// Cache ini hidup selama instance fungsi masih aktif (~1-10 menit di Netlify)
// ===================================================
const CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_METADATA = 60 * 60 * 1000; // 1 jam — metadata jarang berubah
const CACHE_TTL_FORMASI   = 2  * 60 * 1000; // 2 menit — formasi/pelamar bisa berubah

// Target upstream yang terpercaya dan sudah menangani mapping endpoint BKN
const UPSTREAM_BASE = "https://api-sscasn.vercel.app/api";

// Endpoint mana yang dianggap "metadata" (cache panjang)
const METADATA_PATHS = ["/instansi", "/jabatan", "/pendidikan"];

export default async function handler(req: Request, context: Context) {
  // Ambil path setelah /api/sscasn atau setelah sscasn-proxy
  const url = new URL(req.url);
  let rawPath = url.pathname;
  
  // Jika di-redirect oleh Netlify, pathname bisa mengandung .netlify/functions/sscasn-proxy
  if (rawPath.includes("sscasn-proxy")) {
    rawPath = rawPath.split("sscasn-proxy")[1] || "/";
  } else {
    rawPath = rawPath.replace(/^\/api\/sscasn/, "") || "/";
  }

  const upstreamUrl = `${UPSTREAM_BASE}${rawPath}${url.search ? url.search : ""}`;

  // Pilih TTL berdasar jenis endpoint
  const isMetadata = METADATA_PATHS.some((p) => rawPath.startsWith(p));
  const cacheTTL = isMetadata ? CACHE_TTL_METADATA : CACHE_TTL_FORMASI;

  // Cek cache
  const cached = CACHE.get(upstreamUrl);
  if (cached && Date.now() - cached.timestamp < cacheTTL) {
    return new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: corsHeaders("application/json"),
    });
  }

  // Fetch langsung ke BKN — tidak perlu CORS proxy karena ini server-side
  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; KelasASN-Proxy/1.0)",
        Origin: "https://sscasn.bkn.go.id",
        Referer: "https://sscasn.bkn.go.id/",
      },
      signal: AbortSignal.timeout(10_000), // 10 detik timeout
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream error: ${upstream.status}` }),
        { status: upstream.status, headers: corsHeaders("application/json") }
      );
    }

    const data = await upstream.json();
    CACHE.set(upstreamUrl, { data, timestamp: Date.now() });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: corsHeaders("application/json"),
    });
  } catch (err: any) {
    console.error("[sscasn-proxy] Upstream fetch failed:", err.message);
    return new Response(
      JSON.stringify({ error: "Gagal menghubungi server BKN.", detail: err.message }),
      { status: 502, headers: corsHeaders("application/json") }
    );
  }
}

function corsHeaders(contentType: string): Record<string, string> {
  return {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=60",
  };
}
