-- =====================================================================
-- SUPABASE SCHEMA SETUP FOR ABRAM CMS
-- Tables: blog_posts, release_notes
-- File Location: /supabase-schema.sql
-- =====================================================================

/*
  ---------------------------------------------------------------------
  🤖 CLAUDE AGENT / APP AUTHENTICATION GUIDE FOR DRAFT WRITING
  ---------------------------------------------------------------------
  To allow the Claude agent or other external applications to automatically
  write draft blog posts or release notes to these tables, choose one of
  the following two authentication mechanisms:

  Option A: Use the Service Role Secret Key (Recommended for backend script automation)
  - Supabase provides a powerful "service_role" key (found under Project Settings -> API).
  - When you use this key to instantiate the Supabase client, it bypasses all
    Row-Level Security (RLS) policies (acting as a database superuser).
  - This allows the agent to instantly read, insert, update, or delete drafts.
  - SECURITY WARNING: Never expose the service role key in client-side code
    or check it into version control. It should only be stored as an environment
    variable in a secure, server-side environment.
  - Setup example:
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

  Option B: Create a Dedicated Service Account (Recommended for strict access control)
  - Create a dedicated user account inside the Supabase Authentication dashboard
    (e.g., service-agent@abram.network) with a strong, secure password.
  - Store these credentials in the agent/app's environment variables.
  - Before writing to the database, have the agent authenticate programmatically:
    const { data, error } = await supabase.auth.signInWithPassword({
      email: process.env.AGENT_EMAIL,
      password: process.env.AGENT_PASSWORD,
    });
  - Once signed in, the client SDK automatically attaches the user's JSON Web Token
    (JWT) to all subsequent requests.
  - The Row-Level Security (RLS) policies defined below will recognize the authenticated
    user role and permit insert/update/delete operations.
*/

-- =====================================================================
-- 1. UTILITY FUNCTION & TRIGGERS
-- =====================================================================

-- Create a helper function to automatically update the 'updated_at' timestamp
-- on row update operations.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';


-- =====================================================================
-- 2. TABLE DEFINITIONS
-- =====================================================================

-- BLOG POSTS TABLE
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    summary TEXT,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    author TEXT NOT NULL DEFAULT 'ABRAM Team',
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- RELEASE NOTES TABLE
CREATE TABLE IF NOT EXISTS public.release_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);


-- =====================================================================
-- 3. TIMESTAMP TRIGGERS
-- =====================================================================

-- Drop triggers if they already exist to ensure idempotency when re-running this script.
DROP TRIGGER IF EXISTS trigger_update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trigger_update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_release_notes_updated_at ON public.release_notes;
CREATE TRIGGER trigger_update_release_notes_updated_at
    BEFORE UPDATE ON public.release_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =====================================================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable Row-Level Security on both tables.
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_notes ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies on blog_posts to allow clean re-runs
DROP POLICY IF EXISTS "Allow public read of published blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated read of all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated insert of blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated update of blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated delete of blog posts" ON public.blog_posts;

-- clean up existing policies on release_notes to allow clean re-runs
DROP POLICY IF EXISTS "Allow public read of published release notes" ON public.release_notes;
DROP POLICY IF EXISTS "Allow authenticated read of all release notes" ON public.release_notes;
DROP POLICY IF EXISTS "Allow authenticated insert of release notes" ON public.release_notes;
DROP POLICY IF EXISTS "Allow authenticated update of release notes" ON public.release_notes;
DROP POLICY IF EXISTS "Allow authenticated delete of release notes" ON public.release_notes;

-- Policies for blog_posts:
-- 1. SELECT (Public): Anyone can view published posts.
CREATE POLICY "Allow public read of published blog posts" 
ON public.blog_posts 
FOR SELECT 
USING (status = 'published');

-- 2. SELECT (Authenticated): Logged-in team/agents can view draft posts as well.
CREATE POLICY "Allow authenticated read of all blog posts" 
ON public.blog_posts 
FOR SELECT 
TO authenticated 
USING (true);

-- 3. INSERT (Authenticated): Logged-in users/agents can insert new posts.
CREATE POLICY "Allow authenticated insert of blog posts" 
ON public.blog_posts 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 4. UPDATE (Authenticated): Logged-in users/agents can edit drafts or publish posts.
CREATE POLICY "Allow authenticated update of blog posts" 
ON public.blog_posts 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 5. DELETE (Authenticated): Logged-in users/agents can remove posts.
CREATE POLICY "Allow authenticated delete of blog posts" 
ON public.blog_posts 
FOR DELETE 
TO authenticated 
USING (true);


-- Policies for release_notes:
-- 1. SELECT (Public): Anyone can view published release notes.
CREATE POLICY "Allow public read of published release notes" 
ON public.release_notes 
FOR SELECT 
USING (status = 'published');

-- 2. SELECT (Authenticated): Logged-in team/agents can view draft release notes as well.
CREATE POLICY "Allow authenticated read of all release notes" 
ON public.release_notes 
FOR SELECT 
TO authenticated 
USING (true);

-- 3. INSERT (Authenticated): Logged-in users/agents can insert new release notes.
CREATE POLICY "Allow authenticated insert of release notes" 
ON public.release_notes 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 4. UPDATE (Authenticated): Logged-in users/agents can edit draft release notes or publish them.
CREATE POLICY "Allow authenticated update of release notes" 
ON public.release_notes 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 5. DELETE (Authenticated): Logged-in users/agents can remove release notes.
CREATE POLICY "Allow authenticated delete of release notes" 
ON public.release_notes 
FOR DELETE 
TO authenticated 
USING (true);
