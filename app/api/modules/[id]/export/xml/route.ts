import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { toXML } from '@/lib/export';
import type { TestCase } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const moduleId = params.id;

    // Fetch module (verifies ownership via RLS)
    const { data: moduleRaw, error: moduleError } = await supabase
      .from('modules')
      .select('id, name')
      .eq('id', moduleId)
      .single();

    if (moduleError || !moduleRaw) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const moduleData = moduleRaw as unknown as { id: string; name: string };

    // Fetch all test cases
    const { data: testCasesRaw, error: tcError } = await supabase
      .from('test_cases')
      .select('*')
      .eq('module_id', moduleId)
      .order('id');

    if (tcError) {
      return NextResponse.json({ error: tcError.message }, { status: 500 });
    }

    const testCases = (testCasesRaw as unknown as TestCase[]) ?? [];
    const xml = toXML(testCases, moduleData.name);
    const filename = `${moduleData.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.xml`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[/api/modules/[id]/export/xml]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
