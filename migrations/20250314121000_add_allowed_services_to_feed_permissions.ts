import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('feed_permissions', (table) => {
    table
      .specificType('allowed_services', 'text[]')
      .defaultTo(knex.raw(`ARRAY['ozone']::text[]`))
      .alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('feed_permissions', (table) => {
    table.dropColumn('allowed_services');
  });
}
