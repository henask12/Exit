import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('ec_user')?.value;

  if (!userCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = JSON.parse(decodeURIComponent(userCookie));
    return NextResponse.json({ user }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}


