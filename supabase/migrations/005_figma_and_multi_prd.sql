-- Migration 005: Add Figma token, Figma input type, and multi-PRD columns to modules
-- Run this in the Supabase SQL editor to apply to your live database.

alter table modules
  add column if not exists figma_access_token  text,
  add column if not exists figma_input_type    text,
  add column if not exists figma_file_paths    text[],
  add column if not exists prd_file_paths      text[],
  add column if not exists prd_texts           text[];
