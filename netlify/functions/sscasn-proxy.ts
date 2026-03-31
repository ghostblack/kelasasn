import type { Context, Config } from "@netlify/functions";

export const config: Config = {
  path: "/api/sscasn/*"
};


// ===================================================
// Server-side cache untuk metadata (instansi, jabatan, pendidikan)
// Cache ini hidup selama instance fungsi masih aktif (~1-10 menit di Netlify)
// ===================================================
const CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_METADATA = 60 * 60 * 1000; // 1 jam — metadata jarang berubah
const CACHE_TTL_FORMASI   = 2  * 60 * 1000; // 2 menit — formasi/pelamar bisa berubah
const CACHE_TTL_TUKIN     = 24 * 60 * 60 * 1000; // 24 jam — tukin jarang berubah

// Target upstream yang terpercaya dan sudah menangani mapping endpoint BKN
const UPSTREAM_BASE = "https://api-sscasn.vercel.app/api";
// Tukin K/L API dari aesen.vercel.app
const TUKIN_UPSTREAM = "https://aesen.vercel.app/api/tukin";

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

  // Handle khusus tukin K/L — proxy ke aesen.vercel.app
  if (rawPath === "/tukin-kl") {
    const cached = CACHE.get(TUKIN_UPSTREAM);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_TUKIN) {
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: corsHeaders("application/json"),
      });
    }
    try {
      const upstream = await fetch(TUKIN_UPSTREAM, { headers: { Accept: "application/json" } });
      if (!upstream.ok) {
        return new Response(JSON.stringify({ error: `Tukin upstream error: ${upstream.status}` }), {
          status: upstream.status,
          headers: corsHeaders("application/json"),
        });
      }
      const data = await upstream.json();
      CACHE.set(TUKIN_UPSTREAM, { data, timestamp: Date.now() });
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: corsHeaders("application/json"),
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Gagal mengambil data tukin.", detail: err.message }), {
        status: 502,
        headers: corsHeaders("application/json"),
      });
    }
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

    // Fetch langsung ke Upstream Vercel Proxy
  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json"
        // Menghapus 'Origin', 'Referer', dsb karena vercel proxy sudah menanganinya
        // Menghapus User-Agent custom yang mungkin di-block oleh firewall
      }
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
