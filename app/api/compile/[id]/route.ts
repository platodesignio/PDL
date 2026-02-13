import { prisma } from '@/lib/db/prisma';
import { failEnvelope, guardRequest, respond } from '@/lib/api/common';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const route = '/api/compile/[id]';
  const guarded = await guardRequest(req, route);
  if (guarded.blocked) {
    return respond(guarded.blocked, route, guarded.userId, guarded.setCookies);
  }

  const { id } = await params;

  try {
    const compile = await prisma.pDLCompile.findUnique({ where: { id } });
    if (!compile) {
      return respond(failEnvelope(guarded.executionId, 'invalid_request', 'Compile result not found.'), route, guarded.userId, guarded.setCookies);
    }

    return respond(
      {
        executionId: guarded.executionId,
        ok: true,
        failClass: 'ok',
        userSafeMessage: 'Compile loaded.',
        data: {
          compileId: compile.id,
          constraints: compile.constraints
        }
      },
      route,
      guarded.userId,
      guarded.setCookies
    );
  } catch {
    return respond(failEnvelope(guarded.executionId, 'db_error', 'Database read failed.'), route, guarded.userId, guarded.setCookies);
  }
}
