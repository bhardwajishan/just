import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { parseDocument } from '@/lib/parsers';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB per file
const MAX_FILES = 5;

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
];
const ALLOWED_EXTS = ['pdf', 'docx', 'txt', 'md'];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ProcessedFile {
  name: string;
  text: string;
  size: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    // Support both 'documents' (multi-file) and legacy 'file' (single-file)
    let rawFiles = formData.getAll('documents');
    if (!rawFiles.length) {
      const single = formData.get('file');
      if (single) rawFiles = [single];
    }

    if (!rawFiles.length) {
      return NextResponse.json({ error: 'No file(s) provided' }, { status: 400 });
    }

    const results: ProcessedFile[] = [];

    for (const raw of rawFiles.slice(0, MAX_FILES)) {
      if (typeof raw === 'string') continue;
      const blob = raw as File;

      // Size check
      if (blob.size > MAX_FILE_SIZE) {
        results.push({
          name: blob.name,
          text: '',
          size: blob.size,
          error: `File too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`,
        });
        continue;
      }

      // Type check
      const ext = blob.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ALLOWED_TYPES.includes(blob.type) && !ALLOWED_EXTS.includes(ext)) {
        results.push({
          name: blob.name,
          text: '',
          size: blob.size,
          error: 'Unsupported file type. Allowed: PDF, DOCX, TXT, MD',
        });
        continue;
      }

      // Parse
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const text = await parseDocument(buffer, blob.type, blob.name);

        if (!text.trim()) {
          results.push({
            name: blob.name,
            text: '',
            size: blob.size,
            error: 'Could not extract text from this file',
          });
          continue;
        }

        results.push({
          name: blob.name,
          text: text.slice(0, 100_000),
          size: blob.size,
        });
      } catch {
        results.push({
          name: blob.name,
          text: '',
          size: blob.size,
          error: 'Could not extract text from this file',
        });
      }
    }

    // Legacy single-file response for backward compatibility
    if (rawFiles.length === 1 && formData.has('file')) {
      const first = results[0];
      if (first?.error) {
        return NextResponse.json({ error: first.error }, { status: 422 });
      }
      return NextResponse.json({ prd_text: first?.text ?? '' });
    }

    return NextResponse.json({ files: results });
  } catch (err) {
    console.error('[/api/upload/document]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
