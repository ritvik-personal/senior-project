# Supabase Environment Setup

## Required Environment Variables

Add these to your backend `.env` file:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How to Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on "Settings" in the left sidebar
3. Click on "API" in the settings menu
4. Copy the following values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`

## Example .env file

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Testing the Setup

After setting up the environment variables, you can test the connection:

```bash
cd backend
source venv/bin/activate
python test_supabase_recommendations.py
```

This will test the content-based recommendation algorithm with your Supabase database.
