# Supabase Setup Instructions

## 1. Database Setup

Run the following SQL in your Supabase dashboard (SQL Editor):

```sql
-- Copy and paste the contents of db/schema.sql
```

This will create:

- `bots` table with user authentication
- Row Level Security (RLS) policies
- Storage bucket for knowledge base files
- Storage policies for file access

## 2. Environment Variables

Make sure you have these in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Authentication Required

The API routes expect a valid Supabase auth token. You'll need to:

1. Implement user authentication in your app
2. Store the session token (currently hardcoded as `localStorage.getItem('supabase-token')`)
3. Update the form to use the actual auth token

## 4. Storage Configuration

The system creates a private storage bucket called `bot-knowledge` where:

- Files are organized by user ID: `{user_id}/{timestamp}.{extension}`
- Users can only access their own files
- Supported file types: .txt, .pdf, .doc, .docx

## 5. API Endpoints

### POST /api/bots

Creates a new bot with optional file upload.

**Request:**

- Method: POST
- Headers: `Authorization: Bearer {token}`
- Body: FormData with fields:
  - `name` (required): Bot name
  - `instructions`: System instructions
  - `color`: Hex color code
  - `file`: Knowledge base file

**Response:**

```json
{
  "success": true,
  "bot": {
    "id": "uuid",
    "name": "Bot Name",
    "instructions": "...",
    "color": "#3b82f6",
    "knowledge_file_name": "document.pdf",
    "created_at": "2025-10-27T..."
  }
}
```

### GET /api/bots

Retrieves all bots for the authenticated user.

## 6. Next Steps

1. Set up Supabase authentication
2. Run the schema SQL in your Supabase dashboard
3. Test the bot creation flow
4. Implement bot listing/management pages
