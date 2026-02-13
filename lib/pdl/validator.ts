import type { PDLLine } from '@/lib/pdl/parser';

const allowedVocab = new Set([
  'executionId',
  'failClass',
  'userSafeMessage',
  'feedback',
  'rateLimit',
  'budgetCap',
  'csrf',
  'session',
  'logging',
  'route',
  'response',
  'constraint',
  'output',
  'compile',
  'generate',
  'check',
  'validate',
  'module',
  'security',
  'ops'
]);

export function validatePDL(lines: PDLLine[]):
  | { ok: true }
  | { ok: false; failClass: 'pdl_vocab_error' | 'pdl_missing_required'; message: string } {
  const moduleCount = lines.filter((line) => line.command === 'Module').length;
  if (moduleCount === 0) {
    return { ok: false, failClass: 'pdl_missing_required', message: 'At least one Module line is required.' };
  }

  const requiredKeys = new Set(['executionId', 'failClass', 'feedback']);
  const seenRequired = new Set<string>();

  for (const line of lines) {
    const vocabToken = line.key.split('.').at(0) ?? line.key;
    if (!allowedVocab.has(vocabToken)) {
      return {
        ok: false,
        failClass: 'pdl_vocab_error',
        message: `Unknown vocabulary '${vocabToken}' at line ${line.lineNumber}.`
      };
    }

    if (requiredKeys.has(vocabToken)) {
      seenRequired.add(vocabToken);
    }
  }

  for (const required of requiredKeys) {
    if (!seenRequired.has(required)) {
      return {
        ok: false,
        failClass: 'pdl_missing_required',
        message: `Required key '${required}' is missing.`
      };
    }
  }

  return { ok: true };
}
