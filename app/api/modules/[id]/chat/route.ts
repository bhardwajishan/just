import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { buildRagPrompt, callClaude } from '@/lib/anthropic';
import type { ChatRequest, ChatResponse, ApiError, TestCase, ChatMessage } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ChatResponse | ApiError>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ChatRequest = await request.json();
    const { message } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const moduleId = params.id;

    // Fetch module details
    const { data: moduleRaw, error: moduleError } = await supabase
      .from('modules')
      .select('*, projects!inner(user_id)')
      .eq('id', moduleId)
      .single();

    if (moduleError || !moduleRaw) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const moduleData = moduleRaw as unknown as {
      prd_text: string | null;
      figma_description: string | null;
      flow_description: string | null;
      desired_count: number;
      coverage_areas: string[];
      projects: { user_id: string };
    };

    // Fetch existing test cases
    const { data: existingTCsRaw, error: tcError } = await supabase
      .from('test_cases')
      .select('*')
      .eq('module_id', moduleId)
      .order('id');

    if (tcError) {
      return NextResponse.json({ error: tcError.message }, { status: 500 });
    }

    // Fetch chat history
    const { data: chatHistoryRaw, error: chatError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at', { ascending: true });

    if (chatError) {
      return NextResponse.json({ error: chatError.message }, { status: 500 });
    }

    const existingTCs = (existingTCsRaw as unknown as TestCase[]) ?? [];
    const chatHistoryData = (chatHistoryRaw as unknown as ChatMessage[]) ?? [];

    const prompt = buildRagPrompt({
      prd_text: moduleData.prd_text,
      figma_description: moduleData.figma_description,
      flow_description: moduleData.flow_description,
      desired_count: moduleData.desired_count,
      coverage_areas: moduleData.coverage_areas ?? [],
      existingTestCases: existingTCs,
      chatHistory: chatHistoryData.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      userMessage: message,
    });

    const testCases = await callClaude(prompt);

    return NextResponse.json({ testCases });
  } catch (err) {
    console.error('[/api/modules/[id]/chat]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
