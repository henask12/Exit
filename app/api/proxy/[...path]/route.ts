import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://alphaapi-et-transitpax.azurewebsites.net/api';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const COOKIE_CLEAR_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 0,
};

function buildBackendUrl(pathParts: string[], search: string) {
  const path = pathParts.join('/');
  return `${BACKEND_API_BASE_URL}/${path}${search || ''}`;
}

function filterHopByHopHeaders(headers: Headers) {
  const out = new Headers(headers);
  // Remove headers that should not be forwarded
  [
    'host',
    'connection',
    'content-length',
    'cookie',
    'set-cookie',
    'accept-encoding',
    'transfer-encoding',
  ].forEach((h) => out.delete(h));
  return out;
}

async function refreshTokens(refreshToken: string) {
  const res = await fetch(`${BACKEND_API_BASE_URL}/Auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data?.token || !data?.refreshToken || !data?.user) return null;
  return data;
}

async function forward(req: Request, token: string, backendUrl: string) {
  const headers = filterHopByHopHeaders(req.headers);
  headers.set('Authorization', `Bearer ${token}`);

  const method = req.method.toUpperCase();
  const init: RequestInit = { method, headers };

  if (method !== 'GET' && method !== 'HEAD') {
    const buf = await req.arrayBuffer();
    init.body = buf.byteLength ? buf : undefined;
  }

  return fetch(backendUrl, init);
}

async function handler(req: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const url = new URL(req.url);
  const backendUrl = buildBackendUrl(path, url.search);
  const debug = process.env.NODE_ENV !== 'production';

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('ec_at')?.value;
  const refreshToken = cookieStore.get('ec_rt')?.value;

  if (!accessToken) {
    const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    res.cookies.set('ec_at', '', COOKIE_CLEAR_OPTIONS);
    res.cookies.set('ec_rt', '', COOKIE_CLEAR_OPTIONS);
    res.cookies.set('ec_user', '', COOKIE_CLEAR_OPTIONS);
    return res;
  }

  // First attempt
  let upstream: Response;
  try {
    if (debug) {
      console.log(`[proxy] ${req.method} ${url.pathname}${url.search} -> ${backendUrl}`);
    }
    upstream = await forward(req, accessToken, backendUrl);
  } catch (e: any) {
    if (debug) console.error('[proxy] upstream fetch failed', e?.message || e);
    return NextResponse.json(
      { error: 'Upstream fetch failed', details: e?.message || String(e) },
      { status: 502 }
    );
  }

  // If unauthorized, attempt refresh and retry once
  if (upstream.status === 401 && refreshToken) {
    const refreshed = await refreshTokens(refreshToken);
    if (!refreshed) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      res.cookies.set('ec_at', '', COOKIE_CLEAR_OPTIONS);
      res.cookies.set('ec_rt', '', COOKIE_CLEAR_OPTIONS);
      res.cookies.set('ec_user', '', COOKIE_CLEAR_OPTIONS);
      return res;
    }

    // Retry with new access token
    try {
      if (debug) console.log('[proxy] retry after refresh');
      upstream = await forward(req, refreshed.token, backendUrl);
    } catch (e: any) {
      if (debug) console.error('[proxy] upstream fetch failed after refresh', e?.message || e);
      const res = NextResponse.json(
        { error: 'Upstream fetch failed', details: e?.message || String(e) },
        { status: 502 }
      );
      res.cookies.set('ec_at', '', COOKIE_CLEAR_OPTIONS);
      res.cookies.set('ec_rt', '', COOKIE_CLEAR_OPTIONS);
      res.cookies.set('ec_user', '', COOKIE_CLEAR_OPTIONS);
      return res;
    }

    // Build response (and persist refreshed cookies)
    const body = await upstream.arrayBuffer();
    const res = new NextResponse(body, { status: upstream.status });
    upstream.headers.forEach((v, k) => {
      const key = k.toLowerCase();
      // Avoid sending encoding/length headers that don't match the new body
      // (undici may transparently decompress upstream responses).
      if (key === 'set-cookie') return;
      if (key === 'content-encoding') return;
      if (key === 'content-length') return;
      if (key === 'transfer-encoding') return;
      res.headers.set(k, v);
    });

    res.cookies.set('ec_at', refreshed.token, COOKIE_OPTIONS);
    res.cookies.set('ec_rt', refreshed.refreshToken, COOKIE_OPTIONS);
    res.cookies.set('ec_user', encodeURIComponent(JSON.stringify(refreshed.user)), COOKIE_OPTIONS);

    if (debug) {
      res.headers.set('x-proxy-upstream-status', String(upstream.status));
    }
    return res;
  }

  // Normal passthrough response
  const body = await upstream.arrayBuffer();
  const res = new NextResponse(body, { status: upstream.status });
  upstream.headers.forEach((v, k) => {
    const key = k.toLowerCase();
    if (key === 'set-cookie') return;
    if (key === 'content-encoding') return;
    if (key === 'content-length') return;
    if (key === 'transfer-encoding') return;
    res.headers.set(k, v);
  });
  if (debug) {
    res.headers.set('x-proxy-upstream-status', String(upstream.status));
  }
  return res;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;


