-- Self Publish Studio - Database Schema
-- Run this in the Supabase SQL Editor to initialize the database.

-- ============================================================
-- BOOKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'completed', 'failed')),
    current_version INTEGER NOT NULL DEFAULT 1,
    manuscript_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BUILDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS builds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    format TEXT NOT NULL
        CHECK (format IN ('epub', 'pdf', 'xhtml', 'tex', 'lint', 'diff')),
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_builds_book_id ON builds(book_id);
CREATE INDEX IF NOT EXISTS idx_builds_book_version ON builds(book_id, version);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);

-- ============================================================
-- QUOTE REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    genre TEXT,
    timeline TEXT,
    service TEXT NOT NULL
        CHECK (service IN ('Editing', 'Formatting', 'Cover Design', 'Full Publishing Package')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at DESC);

-- ============================================================
-- AUTO-UPDATE UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STORAGE BUCKET SETUP
-- Run this separately in the Supabase SQL Editor or via Dashboard.
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('manuscripts', 'manuscripts', true)
-- ON CONFLICT (id) DO NOTHING;
