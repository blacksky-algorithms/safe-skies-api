-- Migration: Add auth tables
-- Description: Creates tables for storing encrypted auth states and sessions

-- Up Migration
DO $$ 
BEGIN
    -- Create auth_states table
    CREATE TABLE IF NOT EXISTS auth_states (
        key TEXT PRIMARY KEY,
        state TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Create auth_sessions table
    CREATE TABLE IF NOT EXISTS auth_sessions (
        key TEXT PRIMARY KEY,
        session TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Add indexes for performance
    CREATE INDEX IF NOT EXISTS idx_auth_states_created_at ON auth_states(created_at);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_created_at ON auth_sessions(created_at);

    -- Grant necessary permissions if using RLS
    ALTER TABLE auth_states ENABLE ROW LEVEL SECURITY;
    ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
    
    -- Create policies for auth_states
    CREATE POLICY "Allow all operations on auth_states" ON auth_states
    FOR ALL USING (true);
    
    -- Create policies for auth_sessions
    CREATE POLICY "Allow all operations on auth_sessions" ON auth_sessions
    FOR ALL USING (true);

END $$;

-- Down Migration
DO $$
DECLARE
    backup_timestamp TEXT;
BEGIN
    -- Generate timestamp for backup table names
    backup_timestamp := to_char(current_timestamp, 'YYYYMMDD_HH24MISS');

    -- Create backup tables with data before dropping anything
    EXECUTE format('CREATE TABLE auth_sessions_backup_%s AS TABLE auth_sessions', backup_timestamp);
    EXECUTE format('CREATE TABLE auth_states_backup_%s AS TABLE auth_states', backup_timestamp);

    -- Also backup the indexes (they'll be needed for restoration)
    EXECUTE format('CREATE INDEX idx_auth_states_backup_%s_created_at ON auth_states_backup_%s(created_at)', 
        backup_timestamp, backup_timestamp);
    EXECUTE format('CREATE INDEX idx_auth_sessions_backup_%s_created_at ON auth_sessions_backup_%s(created_at)', 
        backup_timestamp, backup_timestamp);

    RAISE NOTICE 'Created backup tables with timestamp: %', backup_timestamp;
    RAISE NOTICE 'Backup tables created: auth_states_backup_%, auth_sessions_backup_%', 
        backup_timestamp, backup_timestamp;

    -- Now proceed with dropping tables
    DROP TABLE IF EXISTS auth_sessions;
    DROP TABLE IF EXISTS auth_states;

    RAISE NOTICE 'Down migration completed. Your data is backed up with timestamp: %', backup_timestamp;
END $$;