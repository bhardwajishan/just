import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { decrypt } from '@/lib/crypto';

export const runtime = 'nodejs';

/** Extract file key from a Figma URL. */
function extractFigmaFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(?:file|design|proto)\/([A-Za-z0-9]+)/);
  return match?.[1] ?? null;
}

/** Recursively extract visible text and component info from a Figma node tree. */
function extractFigmaText(
  node: Record<string, unknown>,
  depth = 0,
  maxDepth = 6
): string[] {
  const parts: string[] = [];
  const type = node.type as string;
  const name = node.name as string;

  if (depth === 0 && name) {
    parts.push(`# File: ${name}`);
  }

  if ((type === 'FRAME' || type === 'COMPONENT' || type === 'PAGE') && name) {
    parts.push(`\n## Screen: ${name}`);
  }

  if (type === 'TEXT' && node.characters) {
    parts.push(`- Text: "${node.characters}"`);
  }

  if (
    (type === 'COMPONENT' || type === 'INSTANCE') &&
    name &&
    depth > 0
  ) {
    parts.push(`- Component: ${name}`);
  }

  if (depth < maxDepth && Array.isArray(node.children)) {
    for (const child of node.children as Record<string, unknown>[]) {
      parts.push(...extractFigmaText(child, depth + 1, maxDepth));
    }
  }

  return parts;
}

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

    const body = await req.json().catch(() => ({}));
    const { figma_url, moduleId } = body as {
      figma_url?: string;
      moduleId?: string;
    };

    if (!figma_url) {
      return NextResponse.json({ error: 'figma_url is required' }, { status: 400 });
    }

    const fileKey = extractFigmaFileKey(figma_url);
    if (!fileKey) {
      return NextResponse.json({ error: 'Invalid Figma URL' }, { status: 400 });
    }

    // ── Resolve access token ─────────────────────────────────────────────────
    let accessToken = '';

    if (moduleId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mod } = await (supabase.from('modules') as any)
        .select('figma_access_token, projects!inner(user_id)')
        .eq('id', moduleId)
        .single();

      if (mod && (mod as { projects: { user_id: string } }).projects.user_id === user.id) {
        const raw = (mod as { figma_access_token: string | null }).figma_access_token;
        if (raw) accessToken = decrypt(raw);
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'FIGMA_TOKEN_REQUIRED',
          message: 'Please provide your Figma access token to import this file.',
        },
        { status: 400 }
      );
    }

    // ── Fetch Figma file ─────────────────────────────────────────────────────
    const figmaRes = await fetch(
      `https://api.figma.com/v1/files/${fileKey}?depth=5`,
      { headers: { 'X-Figma-Token': accessToken } }
    );

    if (!figmaRes.ok) {
      const msg =
        figmaRes.status === 403
          ? 'Invalid Figma token or insufficient permissions.'
          : figmaRes.status === 404
          ? 'Figma file not found. Check the URL and token.'
          : `Figma API error: ${figmaRes.statusText}`;
      return NextResponse.json({ error: msg }, { status: figmaRes.status });
    }

    const figmaData = await figmaRes.json();
    const textLines = extractFigmaText(figmaData.document ?? figmaData, 0, 6);
    const description = textLines.join('\n').slice(0, 8000);

    return NextResponse.json({ description, fileKey });
  } catch (err) {
    console.error('[/api/upload/figma]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
