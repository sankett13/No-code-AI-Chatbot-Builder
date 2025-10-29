-- Create bots table to store bot configurations
CREATE TABLE IF NOT EXISTS bots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  instructions TEXT,
  color VARCHAR(7) DEFAULT '#3b82f6', -- hex color
  knowledge_file_url TEXT, -- URL to uploaded file in Supabase storage
  knowledge_file_name VARCHAR(255), -- original filename
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own bots" ON bots;
DROP POLICY IF EXISTS "Users can insert their own bots" ON bots;
DROP POLICY IF EXISTS "Users can update their own bots" ON bots;
DROP POLICY IF EXISTS "Users can delete their own bots" ON bots;

CREATE POLICY "Users can view their own bots" ON bots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bots" ON bots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bots" ON bots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bots" ON bots
  FOR DELETE USING (auth.uid() = user_id);


-- Enable vector extension and documents table for embeddings
-- NOTE: pgvector extension must be available in your Supabase project
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  chunk TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(1536), -- dimension may vary depending on model
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create storage bucket for knowledge base files (only if it doesn't exist)
-- Note: Storage policies must be configured through Supabase Dashboard due to permissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bot-knowledge', 'bot-knowledge', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies need to be set up manually through the Supabase Dashboard
-- See STORAGE_SETUP.md for detailed instructions