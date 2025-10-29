-- Vector database setup for knowledge base
-- This extends the existing schema to support document embeddings

-- Enable the pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table to store document chunks and their embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- The actual text content of the chunk
  embedding vector(768), -- Google Gemini embedding dimension
  metadata JSONB, -- Store page numbers, section headers, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search (HNSW is faster for large datasets)
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- Create index for bot_id lookups
CREATE INDEX IF NOT EXISTS document_chunks_bot_id_idx 
ON document_chunks(bot_id);

-- Enable RLS on document_chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their bot document chunks" ON document_chunks;
DROP POLICY IF EXISTS "Users can insert their bot document chunks" ON document_chunks;
DROP POLICY IF EXISTS "Users can update their bot document chunks" ON document_chunks;
DROP POLICY IF EXISTS "Users can delete their bot document chunks" ON document_chunks;

-- RLS policies for document_chunks (users can only access chunks from their own bots)
CREATE POLICY "Users can view their bot document chunks" ON document_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bots 
      WHERE bots.id = document_chunks.bot_id 
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their bot document chunks" ON document_chunks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bots 
      WHERE bots.id = document_chunks.bot_id 
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their bot document chunks" ON document_chunks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bots 
      WHERE bots.id = document_chunks.bot_id 
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their bot document chunks" ON document_chunks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bots 
      WHERE bots.id = document_chunks.bot_id 
      AND bots.user_id = auth.uid()
    )
  );

-- Add processing status to bots table to track document processing
ALTER TABLE bots ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE bots ADD COLUMN IF NOT EXISTS chunks_count INTEGER DEFAULT 0;

-- Function to search for similar document chunks using vector similarity
CREATE OR REPLACE FUNCTION search_similar_chunks(
  bot_id UUID,
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE 
    document_chunks.bot_id = bot_id
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;