import type { TestCase } from './types';

export function toXML(testCases: TestCase[], moduleName: string): string {
  const escape = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(`<testSuite name="${escape(moduleName)}">`);

  for (const tc of testCases) {
    lines.push(`  <testCase id="${escape(tc.id)}">`);
    lines.push(`    <title>${escape(tc.title)}</title>`);
    lines.push(`    <priority>${escape(tc.priority)}</priority>`);
    lines.push(`    <type>${escape(tc.type)}</type>`);

    lines.push('    <preconditions>');
    for (const pre of tc.preconditions) {
      lines.push(`      <precondition>${escape(pre)}</precondition>`);
    }
    lines.push('    </preconditions>');

    lines.push('    <steps>');
    tc.steps.forEach((step, i) => {
      lines.push(`      <step number="${i + 1}">${escape(step)}</step>`);
    });
    lines.push('    </steps>');

    lines.push(`    <expectedResult>${escape(tc.expected_result)}</expectedResult>`);
    lines.push('  </testCase>');
  }

  lines.push('</testSuite>');
  return lines.join('\n');
}

export function toTSV(testCases: TestCase[]): string {
  const headers = ['ID', 'Title', 'Priority', 'Type', 'Preconditions', 'Steps', 'Expected Result'];

  const escape = (val: string) => val.replace(/\t/g, ' ').replace(/\n/g, ' | ');

  const rows = testCases.map((tc) => [
    escape(tc.id),
    escape(tc.title),
    escape(tc.priority),
    escape(tc.type),
    escape(tc.preconditions.join(' | ')),
    escape(tc.steps.map((s, i) => `${i + 1}. ${s}`).join(' | ')),
    escape(tc.expected_result),
  ]);

  return [headers, ...rows].map((row) => row.join('\t')).join('\n');
}
