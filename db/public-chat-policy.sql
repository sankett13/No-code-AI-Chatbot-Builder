-- Add public read access for chatbot functionality
-- This allows anyone to read bot details and document chunks for chat purposes

-- Allow public read access to bot details (name and instructions only)
CREATE POLICY "Public can read bot details for chat" ON bots
  FOR SELECT USING (true);

-- Allow public read access to document chunks for chat
CREATE POLICY "Public can read document chunks for chat" ON document_chunks
  FOR SELECT USING (true);

-- Note: This enables public access to all bots. 
-- If you want selective public access, you could add a 'is_public' column to bots
-- and modify the policy to: FOR SELECT USING (is_public = true);