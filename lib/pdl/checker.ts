import type { CompiledConstraint } from '@/lib/pdl/compiler';

export type CheckItem = {
  id: string;
  title: string;
  detail: string;
};

export function generateCheckPlan(constraints: CompiledConstraint): CheckItem[] {
  const baseline: CheckItem[] = [
    {
      id: 'api-execution-id',
      title: 'All APIs issue executionId',
      detail: 'Verify every Route Handler response includes executionId and logs it in ExecutionLog.'
    },
    {
      id: 'api-failclass',
      title: 'Fail class is from fixed enum',
      detail: 'Verify failClass only uses allowed values and maps all failures to userSafeMessage.'
    },
    {
      id: 'ops-rate-budget',
      title: 'Rate and budget controls exist server-side',
      detail: 'Verify rate_limited and budget_exceeded can be returned before expensive operations.'
    },
    {
      id: 'feedback-link',
      title: 'Feedback links to executionId',
      detail: 'Verify feedback writes executionId and screenId and is queryable for support timeline.'
    }
  ];

  const fromConstraints = constraints.flatRules.slice(0, 6).map((rule, index) => ({
    id: `constraint-${index + 1}`,
    title: `${rule.command} ${rule.key}`,
    detail: `Check implementation meets: ${rule.value}`
  }));

  return [...baseline, ...fromConstraints];
}
