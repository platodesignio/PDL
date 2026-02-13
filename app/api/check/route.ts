import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { generateCheckPlan } from '@/lib/pdl/checker';
import type { CompiledConstraint } from '@/lib/pdl/compiler';
import { failEnvelope, guardRequest, parseJson, respond } from '@/lib/api/common';

const schema = z.object({ compileId: z.string().min(1) });

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const route = '/api/check';
  const guarded = await guardRequest(req, route);
  if (guarded.blocked) {
    return respond(guarded.blocked, route, guarded.userId, guarded.setCookies);
  }

  const parsedReq = await parseJson(req, schema);
  if (!parsedReq.ok) {
    return respond(failEnvelope(guarded.executionId, 'invalid_request', 'Request payload is invalid.'), route, guarded.userId, guarded.setCookies);
  }

  try {
    const compile = await prisma.pDLCompile.findUnique({ where: { id: parsedReq.data.compileId } });
    if (!compile) {
      return respond(failEnvelope(guarded.executionId, 'invalid_request', 'Compile result not found.'), route, guarded.userId, guarded.setCookies, parsedReq.data);
    }

    const checks = generateCheckPlan(compile.constraints as CompiledConstraint);

    return respond(
      {
        executionId: guarded.executionId,
        ok: true,
        failClass: 'ok',
        userSafeMessage: 'Check plan generated.',
        data: { checks }
      },
      route,
      guarded.userId,
      guarded.setCookies,
      parsedReq.data
    );
  } catch {
    return respond(failEnvelope(guarded.executionId, 'db_error', 'Database read failed.'), route, guarded.userId, guarded.setCookies, parsedReq.data);
  }
}
