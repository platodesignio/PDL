import { parsePDL } from '@/lib/pdl/parser';
import { validatePDL } from '@/lib/pdl/validator';
import { failEnvelope, guardRequest, parseJson, pdlRequestSchema, respond } from '@/lib/api/common';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const route = '/api/validate';
  const guarded = await guardRequest(req, route);
  if (guarded.blocked) {
    return respond(guarded.blocked, route, guarded.userId, guarded.setCookies);
  }

  const parsedReq = await parseJson(req, pdlRequestSchema);
  if (!parsedReq.ok) {
    const payload = failEnvelope(guarded.executionId, 'invalid_request', 'Request payload is invalid.');
    return respond(payload, route, guarded.userId, guarded.setCookies);
  }

  const syntax = parsePDL(parsedReq.data.sourceText);
  if (!syntax.ok) {
    const payload = failEnvelope(guarded.executionId, 'pdl_syntax_error', syntax.message);
    return respond(payload, route, guarded.userId, guarded.setCookies, parsedReq.data);
  }

  const semantic = validatePDL(syntax.lines);
  if (!semantic.ok) {
    const payload = failEnvelope(guarded.executionId, semantic.failClass, semantic.message);
    return respond(payload, route, guarded.userId, guarded.setCookies, parsedReq.data);
  }

  return respond(
    {
      executionId: guarded.executionId,
      ok: true,
      failClass: 'ok',
      userSafeMessage: 'PDL validation succeeded.',
      data: { lines: syntax.lines.length }
    },
    route,
    guarded.userId,
    guarded.setCookies,
    parsedReq.data
  );
}
