import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { failEnvelope, guardRequest, parseJson, respond } from '@/lib/api/common';

const schema = z.object({
  executionId: z.string().min(1),
  compileId: z.string().min(1).optional(),
  screenId: z.string().min(1).max(120),
  freeText: z.string().min(1).max(500)
});

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const route = '/api/feedback';
  const guarded = await guardRequest(req, route);
  if (guarded.blocked) {
    return respond(guarded.blocked, route, guarded.userId, guarded.setCookies);
  }

  const parsedReq = await parseJson(req, schema);
  if (!parsedReq.ok) {
    return respond(failEnvelope(guarded.executionId, 'invalid_request', 'Request payload is invalid.'), route, guarded.userId, guarded.setCookies);
  }

  try {
    const feedback = await prisma.feedback.create({
      data: {
        executionId: parsedReq.data.executionId,
        compileId: parsedReq.data.compileId,
        userId: guarded.userId,
        screenId: parsedReq.data.screenId,
        freeText: parsedReq.data.freeText
      }
    });

    return respond(
      {
        executionId: guarded.executionId,
        ok: true,
        failClass: 'ok',
        userSafeMessage: 'Feedback saved.',
        data: { feedbackId: feedback.id }
      },
      route,
      guarded.userId,
      guarded.setCookies,
      parsedReq.data
    );
  } catch {
    return respond(failEnvelope(guarded.executionId, 'db_error', 'Database write failed.'), route, guarded.userId, guarded.setCookies, parsedReq.data);
  }
}
