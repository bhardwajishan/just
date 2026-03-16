/**
 * Server-side document parsers for PDF, DOCX, TXT, and MD files.
 * These run in Next.js API routes only (Node.js runtime).
 */

export async function parsePdf(buffer: Buffer): Promise<string> {
  // Import the internal lib file directly to skip pdf-parse's self-test
  // which tries to open './test/data/05-versions-space.pdf' and fails in Next.js
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (
    buf: Buffer
  ) => Promise<{ text: string }>;
  const data = await pdfParse(buffer);
  return data.text;
}

export async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function parsePlainText(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8');
}

export async function parseDocument(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return parsePdf(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    return parseDocx(buffer);
  }

  if (
    mimeType === 'text/plain' ||
    mimeType === 'text/markdown' ||
    ext === 'txt' ||
    ext === 'md'
  ) {
    return parsePlainText(buffer);
  }

  throw new Error(`Unsupported file type: ${mimeType || ext}`);
}
