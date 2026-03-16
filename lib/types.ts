export interface TestCase {
  id: string;
  module_id: string;
  title: string;
  preconditions: string[];
  steps: string[];
  expected_result: string;
  priority: 'High' | 'Medium' | 'Low';
  type: 'Functional' | 'Edge Case' | 'Negative' | 'UI' | 'Integration' | 'Performance';
  version: number;
  created_at?: string;
}

export interface Module {
  id: string;
  project_id: string;
  name: string;
  status: 'draft' | 'generated' | 'confirmed';
  prd_text: string | null;
  figma_url: string | null;
  figma_description: string | null;
  flow_description: string | null;
  desired_count: number;
  coverage_areas: string[];
  // Extended fields added in migration 005
  figma_input_type: 'url' | 'pdf' | 'screenshot' | null;
  figma_file_paths: string[] | null;
  prd_file_paths: string[] | null;
  prd_texts: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  module_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// API request/response shapes

export interface GenerateRequest {
  moduleData: {
    /** @deprecated Use prd_texts instead. Kept for backward compatibility. */
    prd_text?: string;
    /** One entry per uploaded document. Replaces prd_text. */
    prd_texts?: string[];
    figma_description?: string;
    flow_description?: string;
    desired_count: number;
    coverage_areas: string[];
  };
}

export interface GenerateResponse {
  testCases: TestCase[];
}

export interface SaveRequest {
  testCases: TestCase[];
  chatMessage?: {
    role: 'user' | 'assistant';
    content: string;
  };
}

export interface SaveResponse {
  success: boolean;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  testCases: TestCase[];
}

export interface ConfirmUpdateRequest {
  testCases: TestCase[];
}

export interface ConfirmUpdateResponse {
  success: boolean;
}

export interface UploadDocumentResponse {
  /** Legacy single-file response */
  prd_text?: string;
  /** Multi-file response */
  files?: Array<{
    name: string;
    text: string;
    size: number;
    error?: string;
  }>;
}

export interface ApiError {
  error: string;
}
