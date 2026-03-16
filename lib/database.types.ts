export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      modules: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          status: string;
          prd_text: string | null;
          figma_url: string | null;
          figma_description: string | null;
          flow_description: string | null;
          desired_count: number;
          coverage_areas: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          status?: string;
          prd_text?: string | null;
          figma_url?: string | null;
          figma_description?: string | null;
          flow_description?: string | null;
          desired_count?: number;
          coverage_areas?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          status?: string;
          prd_text?: string | null;
          figma_url?: string | null;
          figma_description?: string | null;
          flow_description?: string | null;
          desired_count?: number;
          coverage_areas?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'modules_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      test_cases: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          preconditions: string[];
          steps: string[];
          expected_result: string;
          priority: string;
          type: string;
          version: number;
          created_at: string;
        };
        Insert: {
          id: string;
          module_id: string;
          title: string;
          preconditions?: string[];
          steps?: string[];
          expected_result: string;
          priority?: string;
          type?: string;
          version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          title?: string;
          preconditions?: string[];
          steps?: string[];
          expected_result?: string;
          priority?: string;
          type?: string;
          version?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'test_cases_module_id_fkey';
            columns: ['module_id'];
            isOneToOne: false;
            referencedRelation: 'modules';
            referencedColumns: ['id'];
          }
        ];
      };
      chat_messages: {
        Row: {
          id: string;
          module_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_module_id_fkey';
            columns: ['module_id'];
            isOneToOne: false;
            referencedRelation: 'modules';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
