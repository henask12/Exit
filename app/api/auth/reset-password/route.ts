import { NextResponse } from 'next/server';

const BACKEND_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://alphaapi-et-transitpax.azurewebsites.net/api';

export async function POST(req: Request) {
  try {
    const { employeeId, token, newPassword } = await req.json();
    if (!employeeId || !token || !newPassword) {
      return NextResponse.json({ error: 'Missing employeeId, token, or newPassword' }, { status: 400 });
    }

    const upstream = await fetch(`${BACKEND_API_BASE_URL}/Auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, token, newPassword }),
    });

    const text = await upstream.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: upstream.status });
    } catch {
      return new NextResponse(text, { status: upstream.status });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Request failed' }, { status: 500 });
  }
}


