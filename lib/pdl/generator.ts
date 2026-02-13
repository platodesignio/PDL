import type { CompiledConstraint } from '@/lib/pdl/compiler';

export function generatePrompt(constraints: CompiledConstraint): string {
  const header = [
    'You are implementing software under strict Plato Design Language constraints.',
    'Return one complete final output. Do not emit TODO, pseudocode, or placeholders.',
    'Honor all constraints and explicitly include executionId, failClass, and userSafeMessage contracts.'
  ];

  const body = constraints.flatRules
    .map((rule, index) => `${index + 1}. [${rule.command}] ${rule.key} => ${rule.value}`)
    .join('\n');

  const footer = [
    'Forbidden: dark patterns, infinite scroll, missing ResyncExit, undefined failClass.',
    'Output requirement: production-ready code and concise operational notes.'
  ];

  return [...header, '', 'Constraints:', body, '', ...footer].join('\n');
}
