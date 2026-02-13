import type { PDLLine } from '@/lib/pdl/parser';

export type CompiledConstraint = {
  modules: Array<{
    name: string;
    entries: Array<{ command: string; key: string; value: string }>;
  }>;
  flatRules: Array<{ command: string; key: string; value: string }>;
};

export function compilePDL(lines: PDLLine[]): CompiledConstraint {
  const modules: CompiledConstraint['modules'] = [];
  let currentModule = 'default';

  modules.push({ name: currentModule, entries: [] });

  for (const line of lines) {
    if (line.command === 'Module') {
      currentModule = line.value;
      const exists = modules.find((module) => module.name === currentModule);
      if (!exists) {
        modules.push({ name: currentModule, entries: [] });
      }
      continue;
    }

    const target = modules.find((module) => module.name === currentModule);
    if (target) {
      target.entries.push({ command: line.command, key: line.key, value: line.value });
    }
  }

  const flatRules = modules.flatMap((module) => module.entries);

  return { modules, flatRules };
}
