// migrations/20250222103043_initial_schema.ts
import { Knex } from 'knex';

// Custom type creation helper
async function createEnumType(
  knex: Knex,
  typeName: string,
  values: string[]
): Promise<void> {
  const exists = await knex.raw(
    `
    SELECT 1 FROM pg_type WHERE typname = ?;
  `,
    [typeName]
  );

  if (!exists.rows.length) {
    await knex.raw(`
      CREATE TYPE ${typeName} AS ENUM (${values.map((v) => `'${v}'`).join(', ')});
    `);
  }
}

// Utility functions helper
async function createUtilityFunctions(knex: Knex): Promise<void> {
  // List backups function
  await knex.raw(`
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
  `);

  // Restore from backup function
  await knex.raw(`
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
  `);

  // Cleanup old backups function
  await knex.raw(`
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
  `);
}

export async function up(knex: Knex): Promise<void> {
  // Enable pgcrypto
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // Create enum types
  await createEnumType(knex, 'moderation_action', [
    'post_delete',
    'post_restore',
    'user_ban',
    'user_unban',
    'mod_promote',
    'mod_demote',
  ]);

  await createEnumType(knex, 'user_role', ['admin', 'mod', 'user']);

  // Create tables
  await knex.schema.createTable('profiles', (table) => {
    table.text('did').primary();
    table.text('handle').notNullable();
    table.text('display_name');
    table.text('avatar');
    table.jsonb('associated');
    table.jsonb('labels');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('feed_permissions', (table) => {
    table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
    table.text('did').notNullable();
    table.text('uri').notNullable();
    table.text('feed_name').notNullable();
    table.specificType('role', 'user_role');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.text('created_by');
    table.foreign('did').references('profiles.did').onDelete('CASCADE');
  });

  await knex.schema.createTable('logs', (table) => {
    table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
    table.text('uri').notNullable();
    table.text('performed_by').notNullable();
    table.specificType('action', 'moderation_action').notNullable();
    table.text('target_post_uri');
    table.text('target_user_did');
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.text('ip_address');
    table.text('user_agent');
    table.text('reason');
    table.specificType('to_services', 'TEXT[]');
  });

  await knex.schema.createTable('report_options', (table) => {
    table.text('id').primary();
    table.text('title').notNullable();
    table.text('description');
    table.text('reason').notNullable();
  });

  await knex.schema.createTable('moderation_services', (table) => {
    table.text('value').primary();
    table.text('label').notNullable();
    table.text('feed_gen_endpoint');
  });

  // Create auth tables
  await knex.schema.createTable('auth_states', (table) => {
    table.text('key').primary();
    table.text('state').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index('created_at', 'idx_auth_states_created_at');
  });

  await knex.schema.createTable('auth_sessions', (table) => {
    table.text('key').primary();
    table.text('session').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index('created_at', 'idx_auth_sessions_created_at');
  });

  // Enable RLS on auth tables
  await knex.raw('ALTER TABLE auth_states ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY');

  // Create RLS policies
  await knex.raw(`
    CREATE POLICY "Allow all operations on auth_states" ON auth_states FOR ALL USING (true);
    CREATE POLICY "Allow all operations on auth_sessions" ON auth_sessions FOR ALL USING (true);
  `);

  // Create utility functions
  await createUtilityFunctions(knex);

  // Seed data
  await knex('report_options')
    .insert([
      {
        id: 'misleading',
        title: 'Misleading Post',
        description: 'Impersonation, misinformation, or false claims',
        reason: 'REASONMISLEADING',
      },
      {
        id: 'spam',
        title: 'Spam',
        description: 'Excessive mentions or replies',
        reason: 'REASONSPAM',
      },
      {
        id: 'nsfw',
        title: 'Unwanted Sexual Content',
        description: 'Nudity or adult content not labeled as such',
        reason: 'REASONSEXUAL',
      },
      {
        id: 'behavior',
        title: 'Anti-Social Behavior',
        description: 'Harassment, trolling, or intolerance',
        reason: 'REASONRUDE',
      },
      {
        id: 'illegal',
        title: 'Illegal and Urgent',
        description: 'Glaring violations of law or terms of service',
        reason: 'REASONVIOLATION',
      },
      {
        id: 'other',
        title: 'Other',
        description: 'An issue not included in these options',
        reason: 'REASONOTHER',
      },
    ])
    .onConflict('id')
    .ignore();

  await knex('moderation_services')
    .insert([
      {
        value: 'blacksky',
        label: 'Blacksky Moderation Service',
        feed_gen_endpoint: null,
      },
      {
        value: 'ozone',
        label: 'Ozone Moderation Service',
        feed_gen_endpoint: null,
      },
    ])
    .onConflict('value')
    .ignore();
}

export async function down(knex: Knex): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[-T:]|\.\d{3}Z$/g, '');

  // Backup all tables including auth tables
  const tablesToBackup = [
    'moderation_services',
    'report_options',
    'logs',
    'feed_permissions',
    'profiles',
    'auth_states',
    'auth_sessions',
  ];

  for (const table of tablesToBackup) {
    await knex.raw(
      `CREATE TABLE ${table}_backup_${timestamp} AS TABLE ${table}`
    );
  }

  // Also backup indexes for auth tables
  await knex.raw(`
    CREATE INDEX idx_auth_states_backup_${timestamp}_created_at 
    ON auth_states_backup_${timestamp}(created_at)
  `);
  await knex.raw(`
    CREATE INDEX idx_auth_sessions_backup_${timestamp}_created_at 
    ON auth_sessions_backup_${timestamp}(created_at)
  `);

  // Create and populate enum_backups table
  await knex.schema.createTableIfNotExists('enum_backups', (table) => {
    table.text('backup_timestamp');
    table.text('enum_name');
    table.specificType('enum_values', 'TEXT[]');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Backup enum values
  await knex.raw(
    `
    INSERT INTO enum_backups (backup_timestamp, enum_name, enum_values)
    VALUES 
    (?, 'user_role', ARRAY(SELECT unnest(enum_range(NULL::user_role)::text[]))),
    (?, 'moderation_action', ARRAY(SELECT unnest(enum_range(NULL::moderation_action)::text[])))
  `,
    [timestamp, timestamp]
  );

  // Drop utility functions
  await knex.raw('DROP FUNCTION IF EXISTS cleanup_old_backups(INTEGER)');
  await knex.raw('DROP FUNCTION IF EXISTS restore_from_backup(TEXT)');
  await knex.raw('DROP FUNCTION IF EXISTS list_backups()');

  // Drop tables in reverse order
  await knex.schema
    .dropTableIfExists('auth_sessions')
    .dropTableIfExists('auth_states')
    .dropTableIfExists('moderation_services')
    .dropTableIfExists('report_options')
    .dropTableIfExists('logs')
    .dropTableIfExists('feed_permissions')
    .dropTableIfExists('profiles');

  // Drop enum types
  await knex.raw('DROP TYPE IF EXISTS user_role');
  await knex.raw('DROP TYPE IF EXISTS moderation_action');

  // Log backup timestamp
  console.log(`Backup created with timestamp: ${timestamp}`);
}
