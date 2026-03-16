import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { anthropic, MODEL } from '@/lib/anthropic';
import type { ImageBlockParam, TextBlockParam } from '@anthropic-ai/sdk/resources/messages';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
type AllowedMimeType = (typeof ALLOWED_TYPES)[number];

const EXTRACTION_PROMPT =
  'These are screenshots of a web application UI. Describe the interface in ' +
  'detail: list every visible screen or view name, all text labels, button names, ' +
  'input field labels and placeholder text, navigation elements, headings, form ' +
  'fields, and any visible error or success states. Group your description by screen. ' +
  'Be specific.';

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
      if (!ALLOWED_TYPES.includes(file.type as AllowedMimeType)) {
        return NextResponse.json(
          { error: `${file.name} is not a supported image type (PNG, JPG, WebP).` },
          { status: 415 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `${file.name} exceeds the 10 MB limit.` },
          { status: 413 }
        );
      }
      validFiles.push(file);
    }

    if (!validFiles.length) {
      return NextResponse.json({ error: 'No valid image files' }, { status: 400 });
    }

    // ── Upload to Supabase Storage (best-effort) ─────────────────────────────
    const filePaths: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const ext = file.type.split('/')[1];
      const storagePath = `${user.id}/pending/${Date.now()}-${i}-screenshot.${ext}`;
      try {
        const arrayBuffer = await file.arrayBuffer();
        await supabase.storage
          .from('module-assets')
          .upload(storagePath, Buffer.from(arrayBuffer), {
            contentType: file.type,
            upsert: false,
          });
        filePaths.push(storagePath);
      } catch {
        // Non-fatal
      }
    }

    // ── Send all images to Claude in a single call ───────────────────────────
    const imageBlocks: ImageBlockParam[] = await Promise.all(
      validFiles.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: file.type as AllowedMimeType,
            data: base64,
          },
        };
      })
    );

    const textBlock: TextBlockParam = {
      type: 'text',
      text: EXTRACTION_PROMPT,
    };

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [...imageBlocks, textBlock],
        },
      ],
    });

    const responseBlock = message.content.find((b) => b.type === 'text');
    const description =
      responseBlock && responseBlock.type === 'text' ? responseBlock.text : '';

    return NextResponse.json({
      description,
      fileCount: validFiles.length,
      filePaths,
    });
  } catch (err) {
    console.error('[/api/upload/figma-screenshots]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
