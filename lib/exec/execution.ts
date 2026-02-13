import { randomUUID } from 'node:crypto';

export const failClassValues = [
  'ok',
  'pdl_syntax_error',
  'pdl_vocab_error',
  'pdl_missing_required',
  'invalid_request',
  'rate_limited',
  'budget_exceeded',
  'db_error',
  'unknown'
] as const;

export type FailClass = (typeof failClassValues)[number];

export type ApiEnvelope<T> = {
  executionId: string;
  ok: boolean;
  failClass: FailClass;
  userSafeMessage: string;
  data: T | null;
};

export function createExecutionId(): string {
  return randomUUID();
}

export function toApiEnvelope<T>(input: ApiEnvelope<T>): ApiEnvelope<T> {
  return input;
}
