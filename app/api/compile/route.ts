import { prisma } from '@/lib/db/prisma';
import { parsePDL } from '@/lib/pdl/parser';
import { validatePDL } from '@/lib/pdl/validator';
import { compilePDL } from '@/lib/pdl/compiler';
import { failEnvelope, guardRequest, parseJson, pdlRequestSchema, respond } from '@/lib/api/common';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const route = '/api/compile';
  const guarded = await guardRequest(req, route);
  if (guarded.blocked) {
    return respond(guarded.blocked, route, guarded.userId, guarded.setCookies);
  }

  const parsedReq = await parseJson(req, pdlRequestSchema);
  if (!parsedReq.ok) {
    return respond(failEnvelope(guarded.executionId, 'invalid_request', 'Request payload is invalid.'), route, guarded.userId, guarded.setCookies);
  }

  const syntax = parsePDL(parsedReq.data.sourceText);
  if (!syntax.ok) {
    return respond(failEnvelope(guarded.executionId, 'pdl_syntax_error', syntax.message), route, guarded.userId, guarded.setCookies, parsedReq.data);
  }

  const semantic = validatePDL(syntax.lines);
  if (!semantic.ok) {
    return respond(failEnvelope(guarded.executionId, semantic.failClass, semantic.message), route, guarded.userId, guarded.setCookies, parsedReq.data);
  }

  try {
    const constraints = compilePDL(syntax.lines);
    const doc = await prisma.pDLDocument.create({
      data: {
        userId: guarded.userId,
        title: parsedReq.data.title,
        sourceText: parsedReq.data.sourceText
      }
    });

    const compile = await prisma.pDLCompile.create({
      data: {
        userId: guarded.userId,
        documentId: doc.id,
        constraints,
        compileStatus: 'compiled'
      }
    });

    return respond(
      {
        executionId: guarded.executionId,
        ok: true,
        failClass: 'ok',
        userSafeMessage: 'Compilation succeeded.',
        data: { compileId: compile.id, constraints }
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
