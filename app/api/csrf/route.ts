import { NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/security/session';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getOrCreateUser();
  const response = NextResponse.json({ csrfToken: session.csrfToken });
  for (const cookieSpec of session.setCookies) {
    response.cookies.set(cookieSpec.name, cookieSpec.value, {
      httpOnly: cookieSpec.httpOnly,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
  }
  return response;
}
