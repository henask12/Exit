import { NextResponse } from 'next/server';

const BACKEND_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://alphaapi-et-transitpax.azurewebsites.net/api';

export async function POST(req: Request) {
  try {
    const { employeeId, email } = await req.json();
    if (!employeeId) {
      return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 });
    }

    const upstream = await fetch(`${BACKEND_API_BASE_URL}/Auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(email ? { employeeId, email } : { employeeId }),
    });

    const text = await upstream.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: upstream.status });
    } catch {
      // Backend should return JSON, but keep it safe.
      return new NextResponse(text, { status: upstream.status });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Request failed' }, { status: 500 });
  }
}


