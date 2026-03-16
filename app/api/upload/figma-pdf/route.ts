import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { anthropic, MODEL } from '@/lib/anthropic';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 3;

const EXTRACTION_PROMPT =
  'This is a PDF export of a Figma design file. Describe the UI in detail: ' +
  'list every screen name, all visible text labels, button names, input field ' +
  'labels, form field names, navigation items, headings, and any error or ' +
  'success state text you can see. Be specific and exhaustive. Format as ' +
  'a structured list grouped by screen or section.';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const rawFiles = formData.getAll('files');

    if (!rawFiles.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const validFiles: File[] = [];

    for (const raw of rawFiles.slice(0, MAX_FILES)) {
      if (typeof raw === 'string') continue;
      const file = raw as File;
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: `${file.name} is not a PDF.` },
          { status: 415 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `${file.name} exceeds the 20 MB limit.` },
          { status: 413 }
        );
      }
      validFiles.push(file);
    }

    if (!validFiles.length) {
      return NextResponse.json({ error: 'No valid PDF files' }, { status: 400 });
    }

    // ── Process each PDF with Claude ─────────────────────────────────────────
    const descriptions: string[] = [];
    const filePaths: string[] = [];

    for (const file of validFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      // Upload to Supabase Storage (best-effort)
      const storagePath = `${user.id}/pending/${Date.now()}-figma.pdf`;
      try {
        await supabase.storage
          .from('module-assets')
          .upload(storagePath, Buffer.from(arrayBuffer), {
            contentType: 'application/pdf',
            upsert: false,
          });
        filePaths.push(storagePath);
      } catch {
        // Storage upload is non-fatal
      }

      // Send to Claude for description extraction
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              } as Parameters<typeof anthropic.messages.create>[0]['messages'][0]['content'][0],
              { type: 'text', text: EXTRACTION_PROMPT },
            ],
          },
        ],
      });

      const textBlock = message.content.find((b) => b.type === 'text');
      if (textBlock && textBlock.type === 'text') {
        descriptions.push(textBlock.text);
      }
    }

    const description = descriptions.join('\n\n---\n\n');

    return NextResponse.json({
      description,
      fileCount: validFiles.length,
      filePaths,
    });
  } catch (err) {
    console.error('[/api/upload/figma-pdf]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
