import { prisma } from '@/lib/db/prisma';

const requestWindowMs = 60_000;
const requestMax = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 60);
const budgetMaxPerDay = Number(process.env.BUDGET_MAX_PER_DAY ?? 500);

const bucket = new Map<string, number[]>();

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const existing = bucket.get(key) ?? [];
  const fresh = existing.filter((stamp) => now - stamp < requestWindowMs);
  fresh.push(now);
  bucket.set(key, fresh);
  return fresh.length <= requestMax;
}

export async function checkBudgetLimit(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const used = await prisma.executionLog.count({
    where: {
      userIdAnon: userId,
      createdAt: { gte: since },
      ok: true
    }
  });
  return used < budgetMaxPerDay;
}
