-- Migration: Initial schema setup
-- Description: Creates initial tables and types for the application

-- Up Migration
DO $$ 
BEGIN
  -- Enable the pgcrypto extension for UUID generation
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  -- Create enum for moderation actions
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_action') THEN
    CREATE TYPE moderation_action AS ENUM (
      'post_delete',
      'post_restore',
      'user_ban',
      'user_unban',
      'mod_promote',
      'mod_demote'
    );
  END IF;

  -- Create enum for user roles
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'admin',
      'mod',
      'user'
    );
  END IF;

  -- Create the profiles table
  CREATE TABLE IF NOT EXISTS profiles (
    did TEXT PRIMARY KEY,
    handle TEXT NOT NULL,
    displayName TEXT,
    avatar TEXT,
    associated JSONB,
    labels JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  -- Create the feed_permissions table
  CREATE TABLE IF NOT EXISTS feed_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    did TEXT NOT NULL,
    uri TEXT NOT NULL,
    feed_name TEXT NOT NULL,
    role user_role,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT,
    CONSTRAINT feed_permissions_did_fkey FOREIGN KEY (did)
        REFERENCES profiles(did) ON DELETE CASCADE
  );

  -- Create the logs table
  CREATE TABLE IF NOT EXISTS logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uri TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    action moderation_action NOT NULL,
    target_post_uri TEXT,
    target_user_did TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT,
    reason TEXT,
    to_services TEXT[]
  );

  -- Create the report_options table
  CREATE TABLE IF NOT EXISTS report_options (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    reason TEXT NOT NULL
  );

  -- Create the moderation_services table
  CREATE TABLE IF NOT EXISTS moderation_services (
    value TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    feed_gen_endpoint TEXT
  );

  -- Seed the report_options table
  INSERT INTO report_options (id, title, description, reason)
  VALUES
    ('misleading', 'Misleading Post', 'Impersonation, misinformation, or false claims', 'REASONMISLEADING'),
    ('spam', 'Spam', 'Excessive mentions or replies', 'REASONSPAM'),
    ('nsfw', 'Unwanted Sexual Content', 'Nudity or adult content not labeled as such', 'REASONSEXUAL'),
    ('behavior', 'Anti-Social Behavior', 'Harassment, trolling, or intolerance', 'REASONRUDE'),
    ('illegal', 'Illegal and Urgent', 'Glaring violations of law or terms of service', 'REASONVIOLATION'),
    ('other', 'Other', 'An issue not included in these options', 'REASONOTHER')
  ON CONFLICT (id) DO NOTHING;

  -- Seed the moderation_services table
  INSERT INTO moderation_services (value, label, feed_gen_endpoint)
  VALUES
    ('blacksky', 'Blacksky Moderation Service', NULL),
    ('ozone', 'Ozone Moderation Service', NULL)
  ON CONFLICT (value) DO NOTHING;
END $$;

-- Down Migration
DO $$
DECLARE
    backup_timestamp TEXT;
BEGIN
    -- Generate timestamp for backup table names
    backup_timestamp := to_char(current_timestamp, 'YYYYMMDD_HH24MISS');

    -- Create backup tables with data before dropping anything
    EXECUTE format('CREATE TABLE moderation_services_backup_%s AS TABLE moderation_services', backup_timestamp);
    EXECUTE format('CREATE TABLE report_options_backup_%s AS TABLE report_options', backup_timestamp);
    EXECUTE format('CREATE TABLE logs_backup_%s AS TABLE logs', backup_timestamp);
    EXECUTE format('CREATE TABLE feed_permissions_backup_%s AS TABLE feed_permissions', backup_timestamp);
    EXECUTE format('CREATE TABLE profiles_backup_%s AS TABLE profiles', backup_timestamp);

    -- Store enum values before dropping
    CREATE TABLE IF NOT EXISTS enum_backups (
        backup_timestamp TEXT,
        enum_name TEXT,
        enum_values TEXT[],
        created_at TIMESTAMPTZ DEFAULT current_timestamp
    );

    -- Store the enum values
    INSERT INTO enum_backups (backup_timestamp, enum_name, enum_values)
    VALUES 
    (
        backup_timestamp,
        'user_role',
        ARRAY(SELECT unnest(enum_range(NULL::user_role)::text[]))
    ),
    (
        backup_timestamp,
        'moderation_action',
        ARRAY(SELECT unnest(enum_range(NULL::moderation_action)::text[]))
    );

    RAISE NOTICE 'Created backup tables with timestamp: %', backup_timestamp;

    -- Now proceed with dropping tables in reverse order
    DROP TABLE IF EXISTS moderation_services;
    DROP TABLE IF EXISTS report_options;
    DROP TABLE IF EXISTS logs;
    DROP TABLE IF EXISTS feed_permissions;
    DROP TABLE IF EXISTS profiles;

    -- Drop enums
    DROP TYPE IF EXISTS user_role;
    DROP TYPE IF EXISTS moderation_action;

    -- Drop extension (optional, might want to keep if used by other databases)
    -- DROP EXTENSION IF EXISTS "pgcrypto";

    RAISE NOTICE 'Down migration completed. Your data is backed up with timestamp: %', backup_timestamp;
    RAISE NOTICE 'To restore this backup later, reference this timestamp: %', backup_timestamp;
END $$;