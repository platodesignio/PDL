import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createExecutionId, toApiEnvelope, type ApiEnvelope, type FailClass } from '@/lib/exec/execution';
import { finalizeAndLog } from '@/lib/logging/logger';
import { checkBudgetLimit, checkRateLimit } from '@/lib/security/limits';
import { getOrCreateUser, readSessionCsrf } from '@/lib/security/session';

export const pdlRequestSchema = z.object({
  sourceText: z.string().min(1).max(20_000),
  title: z.string().min(1).max(120).default('Untitled PDL')
});

export async function parseJson<T>(req: Request, schema: z.ZodType<T>): Promise<{ ok: true; data: T } | { ok: false }> {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return { ok: false };
    }
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false };
  }
}

export async function guardRequest(req: Request, route: string): Promise<{
  executionId: string;
  userId: string;
  setCookies: Array<{ name: string; value: string; httpOnly: boolean }>;
  blocked?: ApiEnvelope<null>;
}> {
  const executionId = createExecutionId();
  const { userId, setCookies } = await getOrCreateUser();
  const key = `${route}:${userId}`;
  const rateOk = checkRateLimit(key);
  if (!rateOk) {
    return {
      executionId,
      userId,
      setCookies,
      blocked: toApiEnvelope({
        executionId,
        ok: false,
        failClass: 'rate_limited',
        userSafeMessage: 'Request rate exceeded. Please try again later.',
        data: null
      })
    };
  }

  const budgetOk = await checkBudgetLimit(userId);
  if (!budgetOk) {
    return {
      executionId,
      userId,
      setCookies,
      blocked: toApiEnvelope({
        executionId,
        ok: false,
        failClass: 'budget_exceeded',
        userSafeMessage: 'Daily budget cap reached. Please retry tomorrow.',
        data: null
      })
    };
  }

  if (req.method !== 'GET') {
    const csrfHeader = req.headers.get('x-csrf-token');
    const csrfInSession = await readSessionCsrf();
    if (!csrfHeader || !csrfInSession || csrfHeader !== csrfInSession) {
      return {
        executionId,
        userId,
        setCookies,
        blocked: toApiEnvelope({
          executionId,
          ok: false,
          failClass: 'invalid_request',
          userSafeMessage: 'Security token mismatch. Refresh and retry.',
          data: null
        })
      };
    }
  }

  return { executionId, userId, setCookies };
}

export async function respond<T>(
  envelope: ApiEnvelope<T>,
  route: string,
  userId: string,
  setCookies: Array<{ name: string; value: string; httpOnly: boolean }>,
  requestJson?: unknown
): Promise<NextResponse<ApiEnvelope<T>>> {
  const logged = await finalizeAndLog(envelope, route, userId, requestJson);
  const response = NextResponse.json(logged);

  for (const cookieSpec of setCookies) {
    response.cookies.set(cookieSpec.name, cookieSpec.value, {
      httpOnly: cookieSpec.httpOnly,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
  }

  return response;
}

export function failEnvelope(executionId: string, failClass: FailClass, userSafeMessage: string): ApiEnvelope<null> {
  return toApiEnvelope({ executionId, ok: false, failClass, userSafeMessage, data: null });
}
