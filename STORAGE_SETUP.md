# Supabase Storage Setup Instructions

Since you don't have permissions to modify storage policies via SQL, you'll need to set up storage policies through the Supabase Dashboard.

## Step 1: Run the Minimal Schema

Use `db/schema-minimal.sql` instead of the full schema. This creates the bots table and bucket without trying to modify storage policies.

## Step 2: Configure Storage Policies via Dashboard

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** → **Policies**
3. Find the `objects` table
4. Add these policies manually:

### Policy 1: Allow Upload

- **Policy Name**: `Users can upload their own knowledge files`
- **Allowed Operation**: `INSERT`
- **Target Roles**: `authenticated`
- **Policy Definition**:

```sql
bucket_id = 'bot-knowledge' AND (storage.foldername(name))[1] = auth.uid()::text
```

### Policy 2: Allow Read

- **Policy Name**: `Users can view their own knowledge files`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `authenticated`
- **Policy Definition**:

```sql
bucket_id = 'bot-knowledge' AND (storage.foldername(name))[1] = auth.uid()::text
```

### Policy 3: Allow Update

- **Policy Name**: `Users can update their own knowledge files`
- **Allowed Operation**: `UPDATE`
- **Target Roles**: `authenticated`
- **Policy Definition**:

```sql
bucket_id = 'bot-knowledge' AND (storage.foldername(name))[1] = auth.uid()::text
```

### Policy 4: Allow Delete

- **Policy Name**: `Users can delete their own knowledge files`
- **Allowed Operation**: `DELETE`
- **Target Roles**: `authenticated`
- **Policy Definition**:

```sql
bucket_id = 'bot-knowledge' AND (storage.foldername(name))[1] = auth.uid()::text
```

## Step 3: Alternative - Disable Storage RLS Temporarily

If you want to test quickly, you can disable RLS on storage temporarily:

1. Go to **Database** → **Tables**
2. Find `objects` in the `storage` schema
3. Turn off **Enable RLS**

**⚠️ Warning**: This makes all storage accessible to all users. Only use for testing!

## Step 4: Test the Bot Creation

After setting up the policies (or disabling RLS), try creating a bot again.
