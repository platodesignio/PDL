import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';

const anonCookie = 'pdl_anon';
const sessionCookie = 'pdl_session';

export async function getOrCreateUser(): Promise<{ userId: string; anonKey: string; csrfToken: string; setCookies: Array<{ name: string; value: string; httpOnly: boolean }> }> {
  const cookieStore = await cookies();
  const setCookies: Array<{ name: string; value: string; httpOnly: boolean }> = [];
  let anonKey = cookieStore.get(anonCookie)?.value;

  if (!anonKey) {
    anonKey = `anon_${randomUUID()}`;
    setCookies.push({ name: anonCookie, value: anonKey, httpOnly: true });
  }

  let user = await prisma.user.findUnique({ where: { anonKey } });
  if (!user) {
    user = await prisma.user.create({ data: { anonKey } });
  }

  let sid = cookieStore.get(sessionCookie)?.value;
  let csrfToken = "";

  if (!sid) {
    sid = `sess_${randomUUID()}`;
    csrfToken = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        id: sid,
        userId: user.id,
        csrfToken,
        expiresAt
      }
    });
    setCookies.push({ name: sessionCookie, value: sid, httpOnly: true });
  } else {
    const found = await prisma.session.findUnique({ where: { id: sid } });
    if (found) {
      csrfToken = found.csrfToken;
    } else {
      csrfToken = randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.session.create({
        data: { id: sid, userId: user.id, csrfToken, expiresAt }
      });
    }
  }

  return { userId: user.id, anonKey, csrfToken, setCookies };
}

export async function readSessionCsrf(): Promise<string | null> {
  const cookieStore = await cookies();
  const sid = cookieStore.get(sessionCookie)?.value;
  if (!sid) {
    return null;
  }
  const found = await prisma.session.findUnique({ where: { id: sid } });
  if (!found) {
    return null;
  }
  return found.csrfToken;
}
