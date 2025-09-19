# POSman - Point of Sale Manager

## Supabase Integration Setup

This project uses Supabase for cloud database synchronization and backup features. To set up Supabase integration:

### 1. Create a Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Note your Project URL and anon key

### 2. Configure Environment
1. Copy `src/config/supabaseConfig.example.ts` to `src/config/supabaseConfig.ts`
2. Update the file with your actual Supabase credentials:
   ```typescript
   export const SUPABASE_CONFIG = {
     url: 'https://your-project.supabase.co',
     key: 'your-anon-key',
   };
   ```

### 3. Set up Storage
1. In your Supabase project, go to Storage
2. Create a new bucket named `backups`
3. Set the bucket to public or configure appropriate permissions

### 4. Database Tables
The application will automatically create the necessary tables. For manual setup, you can use the following SQL:

```sql
-- Create sync log table
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  record_id TEXT,
  data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  device_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  synced BOOLEAN DEFAULT false
);
```

### Features Implemented
1. Database backup to Supabase Storage
2. Real-time synchronization (in development)
3. Data export capabilities (in development)

### Security Notes
- Never commit your actual Supabase credentials to version control
- The `.gitignore` file is configured to exclude `src/config/supabaseConfig.ts`
- Use environment variables in production