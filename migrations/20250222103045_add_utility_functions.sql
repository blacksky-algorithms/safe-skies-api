-- Migration: Add database utility functions
-- Description: Creates functions for managing and restoring from backups

-- Up Migration
CREATE OR REPLACE FUNCTION list_backups()
RETURNS TABLE (
    backup_timestamp TEXT,
    created_at TIMESTAMPTZ,
    tables_backed_up TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        split_part(tablename, 'backup_', 2) as timestamp,
        (tablename::text)::TIMESTAMPTZ as created,
        array_agg(split_part(tablename, '_backup_', 1)) as tables
    FROM pg_tables
    WHERE tablename LIKE '%backup_%'
    GROUP BY timestamp, created
    ORDER BY created DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION restore_from_backup(target_timestamp TEXT)
RETURNS void AS $$
DECLARE
    table_exists boolean;
BEGIN
    -- First check if backup exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename LIKE '%backup_' || target_timestamp
    ) THEN
        RAISE EXCEPTION 'No backup found for timestamp: %', target_timestamp;
    END IF;

    -- Restore enum types if they were backed up
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enum_backups') THEN
        IF EXISTS (SELECT 1 FROM enum_backups WHERE backup_timestamp = target_timestamp) THEN
            -- Restore user_role enum if it was backed up
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
                EXECUTE format(
                    'CREATE TYPE user_role AS ENUM (%s)',
                    (SELECT string_agg(quote_literal(unnest), ', ')
                     FROM enum_backups,
                     unnest(enum_values)
                     WHERE backup_timestamp = target_timestamp
                     AND enum_name = 'user_role')
                );
            END IF;

            -- Restore moderation_action enum if it was backed up
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_action') THEN
                EXECUTE format(
                    'CREATE TYPE moderation_action AS ENUM (%s)',
                    (SELECT string_agg(quote_literal(unnest), ', ')
                     FROM enum_backups,
                     unnest(enum_values)
                     WHERE backup_timestamp = target_timestamp
                     AND enum_name = 'moderation_action')
                );
            END IF;
        END IF;
    END IF;

    -- Restore main schema tables if they were backed up
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles_backup_' || target_timestamp) THEN
        -- Restore profiles first (due to foreign key constraints)
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
            EXECUTE format('CREATE TABLE profiles AS TABLE profiles_backup_%s', target_timestamp);
            ALTER TABLE profiles ADD PRIMARY KEY (did);
        END IF;

        -- Restore feed_permissions
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'feed_permissions') THEN
            EXECUTE format('CREATE TABLE feed_permissions AS TABLE feed_permissions_backup_%s', target_timestamp);
            ALTER TABLE feed_permissions ADD PRIMARY KEY (id);
            ALTER TABLE feed_permissions 
                ADD CONSTRAINT feed_permissions_did_fkey 
                FOREIGN KEY (did) REFERENCES profiles(did) ON DELETE CASCADE;
        END IF;

        -- Restore other tables
        EXECUTE format('CREATE TABLE IF NOT EXISTS logs AS TABLE logs_backup_%s', target_timestamp);
        EXECUTE format('CREATE TABLE IF NOT EXISTS report_options AS TABLE report_options_backup_%s', target_timestamp);
        EXECUTE format('CREATE TABLE IF NOT EXISTS moderation_services AS TABLE moderation_services_backup_%s', target_timestamp);
    END IF;

    -- Restore auth tables if they were backed up
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'auth_states_backup_' || target_timestamp) THEN
        -- Restore auth_states
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'auth_states') THEN
            EXECUTE format('CREATE TABLE auth_states AS TABLE auth_states_backup_%s', target_timestamp);
            ALTER TABLE auth_states ADD PRIMARY KEY (key);
            EXECUTE format('CREATE INDEX idx_auth_states_created_at ON auth_states(created_at)');
            ALTER TABLE auth_states ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "Allow all operations on auth_states" ON auth_states FOR ALL USING (true);
        END IF;

        -- Restore auth_sessions
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'auth_sessions') THEN
            EXECUTE format('CREATE TABLE auth_sessions AS TABLE auth_sessions_backup_%s', target_timestamp);
            ALTER TABLE auth_sessions ADD PRIMARY KEY (key);
            EXECUTE format('CREATE INDEX idx_auth_sessions_created_at ON auth_sessions(created_at)');
            ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "Allow all operations on auth_sessions" ON auth_sessions FOR ALL USING (true);
        END IF;
    END IF;

    RAISE NOTICE 'Successfully restored from backup timestamp: %', target_timestamp;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_backups(older_than_days INTEGER DEFAULT 30)
RETURNS void AS $$
DECLARE
    backup record;
BEGIN
    FOR backup IN 
        SELECT DISTINCT split_part(tablename, 'backup_', 2) as timestamp
        FROM pg_tables 
        WHERE tablename LIKE '%backup_%'
        AND to_timestamp(split_part(tablename, 'backup_', 2), 'YYYYMMDD_HH24MISS') < current_timestamp - (older_than_days || ' days')::interval
    LOOP
        -- Drop all backup tables for this timestamp
        EXECUTE format('DROP TABLE IF EXISTS profiles_backup_%s', backup.timestamp);
        EXECUTE format('DROP TABLE IF EXISTS feed_permissions_backup_%s', backup.timestamp);
        EXECUTE format('DROP TABLE IF EXISTS logs_backup_%s', backup.timestamp);
        EXECUTE format('DROP TABLE IF EXISTS report_options_backup_%s', backup.timestamp);
        EXECUTE format('DROP TABLE IF EXISTS moderation_services_backup_%s', backup.timestamp);
        EXECUTE format('DROP TABLE IF EXISTS auth_states_backup_%s', backup.timestamp);
        EXECUTE format('DROP TABLE IF EXISTS auth_sessions_backup_%s', backup.timestamp);
        
        -- Delete enum backups if they exist
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enum_backups') THEN
            DELETE FROM enum_backups WHERE backup_timestamp = backup.timestamp;
        END IF;
        
        RAISE NOTICE 'Cleaned up backup set from timestamp: %', backup.timestamp;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Down Migration
DO $$
BEGIN
    DROP FUNCTION IF EXISTS cleanup_old_backups(INTEGER);
    DROP FUNCTION IF EXISTS restore_from_backup(TEXT);
    DROP FUNCTION IF EXISTS list_backups();
END $$;