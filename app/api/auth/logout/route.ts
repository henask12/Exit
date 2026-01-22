import { NextResponse } from 'next/server';

const COOKIE_CLEAR_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 0,
};

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set('ec_at', '', COOKIE_CLEAR_OPTIONS);
  res.cookies.set('ec_rt', '', COOKIE_CLEAR_OPTIONS);
  res.cookies.set('ec_user', '', COOKIE_CLEAR_OPTIONS);
  return res;
}


