import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('feed_permissions', (table) => {
    table.specificType('allowed_services', 'text[]');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('feed_permissions', (table) => {
    table.dropColumn('allowed_services');
  });
}
