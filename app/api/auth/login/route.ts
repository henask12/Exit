import { NextResponse } from 'next/server';

const BACKEND_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://alphaapi-et-transitpax.azurewebsites.net/api';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const employeeId = body?.employeeId;
    const password = body?.password;
    if (!employeeId || !password || typeof employeeId !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, password }),
    });

    // Read text first so we can safely handle non-JSON / malformed responses
    const rawText = await res.text().catch(() => '');
    const data = rawText ? JSON.parse(rawText) : null;

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error || data?.message || rawText || 'Login failed' },
        { status: res.status }
      );
    }

    // Validate expected shape before setting cookies (cookies.set requires strings)
    if (!data?.token || !data?.refreshToken || !data?.user) {
      console.error('[auth/login] unexpected login response shape', {
        status: res.status,
        hasToken: !!data?.token,
        hasRefreshToken: !!data?.refreshToken,
        hasUser: !!data?.user,
        rawText: rawText?.slice(0, 500),
      });
      return NextResponse.json(
        { error: 'Login failed: invalid response from auth server' },
        { status: 502 }
      );
    }

    const response = NextResponse.json({ user: data.user }, { status: 200 });

    // Store tokens + user in HttpOnly cookies (not readable by JS)
    response.cookies.set('ec_at', String(data.token), COOKIE_OPTIONS);
    response.cookies.set('ec_rt', String(data.refreshToken), COOKIE_OPTIONS);
    response.cookies.set('ec_user', encodeURIComponent(JSON.stringify(data.user)), COOKIE_OPTIONS);

    return response;
  } catch (e: any) {
    console.error('[auth/login] error', e);
    return NextResponse.json({ error: e?.message || 'Login failed' }, { status: 500 });
  }
}


