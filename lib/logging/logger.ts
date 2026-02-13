import { prisma } from '@/lib/db/prisma';
import type { ApiEnvelope, FailClass } from '@/lib/exec/execution';

type LogInput = {
  executionId: string;
  route: string;
  userIdAnon: string;
  failClass: FailClass;
  ok: boolean;
  userSafeMessage: string;
  requestJson?: unknown;
  responseJson?: unknown;
};

export async function writeExecutionLog(input: LogInput): Promise<void> {
  await prisma.executionLog.create({
    data: {
      executionId: input.executionId,
      route: input.route,
      userIdAnon: input.userIdAnon,
      failClass: input.failClass,
      ok: input.ok,
      userSafeMessage: input.userSafeMessage,
      requestJson: input.requestJson,
      responseJson: input.responseJson
    }
  });
}

export async function finalizeAndLog<T>(
  envelope: ApiEnvelope<T>,
  route: string,
  userIdAnon: string,
  requestJson?: unknown
): Promise<ApiEnvelope<T>> {
  await writeExecutionLog({
    executionId: envelope.executionId,
    route,
    userIdAnon,
    failClass: envelope.failClass,
    ok: envelope.ok,
    userSafeMessage: envelope.userSafeMessage,
    requestJson,
    responseJson: envelope
  });
  return envelope;
}
