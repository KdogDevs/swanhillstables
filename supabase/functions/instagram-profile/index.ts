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

async function fetchInstagramProfile(username: string) {
  // Try the public web_profile_info endpoint (used by instagram.com itself).
  const endpoint = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
  const res = await fetch(endpoint, {
    headers: {
      'User-Agent': UA,
      'X-IG-App-ID': '936619743392459',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': `https://www.instagram.com/${username}/`,
    },
  });

  if (!res.ok) {
    throw new Error(`Instagram API returned ${res.status}`);
  }

  const json = await res.json();
  const user = json?.data?.user;
  if (!user) throw new Error('No user data in Instagram response');

  const followerCount: number = user.edge_followed_by?.count ?? 0;
  const picUrl: string = user.profile_pic_url_hd || user.profile_pic_url || '';
  const fullName: string = user.full_name || '';
  const biography: string = user.biography || '';
  const isVerified: boolean = !!user.is_verified;

  const profilePic = picUrl ? await fetchProfilePicAsDataUrl(picUrl) : null;

  return {
    username,
    fullName,
    biography,
    isVerified,
    followerCount,
    followerCountFormatted: formatCount(followerCount),
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