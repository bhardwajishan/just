import Anthropic from '@anthropic-ai/sdk';
import type { TestCase } from './types';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const MODEL = 'claude-sonnet-4-20250514';

export const SYSTEM_PROMPT = `You are an expert QA engineer specializing in writing comprehensive manual test cases. 
Your job is to generate detailed, structured test cases based on product requirements, design descriptions, and user flows.

Guidelines:
- Write test cases that are clear, actionable, and unambiguous
- Cover happy paths, edge cases, negative scenarios, and UI interactions
- Each test case must have a unique ID within the format TC-XXX (e.g., TC-001)
- Preconditions should describe the state before the test begins
- Steps should be numbered and specific, describing exact user actions
- Expected results should be precise and verifiable
- Assign priority: High (critical path), Medium (important), Low (nice-to-have)
- Assign type: Functional, Edge Case, Negative, UI, Integration, or Performance

You MUST respond with ONLY a valid JSON array of test case objects. No prose before or after.
Each object must have these exact fields:
{
  "id": "TC-001",
  "title": "string",
  "preconditions": ["string"],
  "steps": ["string"],
  "expected_result": "string",
  "priority": "High" | "Medium" | "Low",
  "type": "Functional" | "Edge Case" | "Negative" | "UI" | "Integration" | "Performance"
}`;

const MAX_PRD_CHARS_PER_DOC = 4000;
const TRUNCATION_SUFFIX = '\n[truncated — document continues]';

export function buildGenerationPrompt(params: {
  prd_text?: string;
  prd_texts?: string[];
  figma_description?: string;
  flow_description?: string;
  desired_count: number;
  coverage_areas: string[];
}): string {
  const parts: string[] = [];

  parts.push(`Generate exactly ${params.desired_count} manual test cases.`);

  if (params.coverage_areas.length > 0) {
    parts.push(`\nFocus on these coverage areas: ${params.coverage_areas.join(', ')}.`);
  }

  // Normalise PRD inputs: prd_texts[] takes precedence; fall back to legacy prd_text
  const prdTexts: string[] = [];
  if (params.prd_texts && params.prd_texts.length > 0) {
    prdTexts.push(...params.prd_texts.filter(Boolean));
  } else if (params.prd_text) {
    prdTexts.push(params.prd_text);
  }

  if (prdTexts.length > 0) {
    parts.push(
      `\n## Requirement documents (${prdTexts.length} uploaded)\n`
    );
    prdTexts.forEach((text, i) => {
      const truncated =
        text.length > MAX_PRD_CHARS_PER_DOC
          ? text.slice(0, MAX_PRD_CHARS_PER_DOC) + TRUNCATION_SUFFIX
          : text;
      parts.push(`### Document ${i + 1}\n${truncated}`);
    });
  }

  if (params.figma_description) {
    parts.push(`\n## UI/Design Description (from Figma)\n${params.figma_description}`);
  }

  if (params.flow_description) {
    parts.push(`\n## User Flow & Coverage Description\n${params.flow_description}`);
  }

  parts.push('\nRespond with ONLY the JSON array.');

  return parts.join('\n');
}

export function buildRagPrompt(params: {
  prd_text?: string | null;
  figma_description?: string | null;
  flow_description?: string | null;
  desired_count: number;
  coverage_areas: string[];
  existingTestCases: TestCase[];
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage: string;
}): string {
  const parts: string[] = [];

  parts.push('## Original Module Context');
  if (params.prd_text) {
    parts.push(`\n### PRD\n${params.prd_text}`);
  }
  if (params.figma_description) {
    parts.push(`\n### UI Description\n${params.figma_description}`);
  }
  if (params.flow_description) {
    parts.push(`\n### Flow Description\n${params.flow_description}`);
  }

  parts.push(`\n## Existing Test Cases (${params.existingTestCases.length} total)\n`);
  parts.push(JSON.stringify(params.existingTestCases, null, 2));

  if (params.chatHistory.length > 0) {
    parts.push('\n## Previous Conversation');
    for (const msg of params.chatHistory) {
      parts.push(`\n[${msg.role.toUpperCase()}]: ${msg.content}`);
    }
  }

  parts.push(`\n## New User Request\n${params.userMessage}`);
  parts.push(
    '\nBased on the context and request, return the COMPLETE updated set of test cases as a JSON array. Include all previously confirmed test cases plus any new/modified ones. Respond with ONLY the JSON array.'
  );

  return parts.join('\n');
}

export async function callClaude(prompt: string): Promise<TestCase[]> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const text = content.text.trim();
  // Strip markdown code fences if present
  const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    return parsed as TestCase[];
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${text.slice(0, 200)}`);
  }
}
