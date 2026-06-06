import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Public Instagram profile fetch. Returns profile pic (base64 data URL) and follower count.
// Cached in-memory for 10 minutes to avoid rate limits.

type CacheEntry = { ts: number; data: any };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 10 * 60 * 1000;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return String(n);
}

async function fetchProfilePicAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://www.instagram.com/' } });
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    let binary = '';
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    return `data:${contentType};base64,${btoa(binary)}`;
  } catch (_) {
    return null;
  }
}

function parseCount(raw: string): number {
  const s = raw.trim().toUpperCase().replace(/,/g, '');
  const m = s.match(/^([\d.]+)\s*([KMB])?$/);
  if (!m) return parseInt(s, 10) || 0;
  const n = parseFloat(m[1]);
  const mult = m[2] === 'B' ? 1e9 : m[2] === 'M' ? 1e6 : m[2] === 'K' ? 1e3 : 1;
  return Math.round(n * mult);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function fetchInstagramProfile(username: string) {
  // Scrape the public profile HTML. The OpenGraph meta description contains:
  // "1,234 Followers, 56 Following, 78 Posts - See Instagram photos and videos from Full Name (@handle)"
  const res = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!res.ok) throw new Error(`Instagram returned ${res.status}`);
  const html = await res.text();

  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  const ogDesc = html.match(/<meta(?: name| property)="(?:og:)?description" content="([^"]+)"/)?.[1] ?? '';
  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ?? '';

  // Debug: peek at meta tags & key tokens
  const metas = html.match(/<meta[^>]*>/gi)?.slice(0, 12) ?? [];
  const idxFollowers = html.toLowerCase().indexOf('followers');
  const followersSnippet = idxFollowers >= 0 ? html.slice(Math.max(0, idxFollowers - 100), idxFollowers + 100) : '';
  console.log('IG fetch', { username, htmlLen: html.length, metas, followersSnippet });

  const desc = decodeEntities(ogDesc);
  const title = decodeEntities(ogTitle);

  // "1,234 Followers, 56 Following, 78 Posts - See Instagram photos and videos from Full Name (@handle)"
  const followersMatch = desc.match(/([\d.,]+[KMB]?)\s+Followers/i);
  const followerCount = followersMatch ? parseCount(followersMatch[1]) : 0;

  const nameMatch =
    title.match(/^(.*?)\s*\(@/) ||
    desc.match(/from\s+(.+?)\s*\(@/i);
  const fullName = nameMatch ? nameMatch[1].trim() : '';

  const picUrl = ogImage ? decodeEntities(ogImage) : '';
  const profilePic = picUrl ? await fetchProfilePicAsDataUrl(picUrl) : null;

  return {
    username,
    fullName,
    biography: '',
    isVerified: false,
    followerCount,
    followerCountFormatted: followerCount ? formatCount(followerCount) : '—',
    profilePic,
    fetchedAt: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const username = (url.searchParams.get('username') || 'swan.hill.stables').replace(/^@/, '').trim();
    if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) {
      return new Response(JSON.stringify({ error: 'Invalid username' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cached = cache.get(username);
    if (cached && Date.now() - cached.ts < TTL_MS) {
      return new Response(JSON.stringify({ ...cached.data, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await fetchInstagramProfile(username);
    cache.set(username, { ts: Date.now(), data });

    return new Response(JSON.stringify({ ...data, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});