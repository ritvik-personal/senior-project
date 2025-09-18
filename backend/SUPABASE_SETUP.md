# Supabase Authentication Setup

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and API keys

## 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Environment
ENVIRONMENT=development
```

## 3. Database Schema

In your Supabase SQL editor, run this to create the users table:

```sql
-- Create users table
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);
```

## 4. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## 5. Test the API

Start the backend:
```bash
python main.py
```

Test the endpoints:
- Health check: http://localhost:8000/api/health
- API docs: http://localhost:8000/docs
- Login: POST http://localhost:8000/api/auth/login
- Register: POST http://localhost:8000/api/auth/register

## 6. Frontend Integration

Update your frontend login form to call:
```
POST http://localhost:8000/api/auth/login
```

With JSON body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
