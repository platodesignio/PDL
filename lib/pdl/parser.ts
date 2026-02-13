export type PDLCommand = 'Declare' | 'Rule' | 'Check' | 'Fail' | 'Log' | 'Module';

export type PDLLine = {
  lineNumber: number;
  command: PDLCommand;
  key: string;
  value: string;
};

const allowedCommands = new Set<PDLCommand>(['Declare', 'Rule', 'Check', 'Fail', 'Log', 'Module']);

export function parsePDL(source: string): { ok: true; lines: PDLLine[] } | { ok: false; message: string } {
  const out: PDLLine[] = [];
  const split = source.split('\n');

  for (let index = 0; index < split.length; index += 1) {
    const original = split[index];
    if (original.trim().length === 0) {
      continue;
    }

    if (/^\s+/.test(original)) {
      return { ok: false, message: `Line ${index + 1}: indentation is not allowed.` };
    }

    const line = original.trim();
    const commandMatch = line.match(/^(Declare|Rule|Check|Fail|Log|Module)\s*:\s*([^:]+)\s*:\s*(.+)$/);
    if (!commandMatch) {
      return { ok: false, message: `Line ${index + 1}: expected 'Command:key:value' format.` };
    }

    const [, command, key, value] = commandMatch;
    if (!allowedCommands.has(command as PDLCommand)) {
      return { ok: false, message: `Line ${index + 1}: unsupported command.` };
    }

    out.push({
      lineNumber: index + 1,
      command: command as PDLCommand,
      key: key.trim(),
      value: value.trim()
    });
  }

  return { ok: true, lines: out };
}
