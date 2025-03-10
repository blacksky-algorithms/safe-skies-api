import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('feed_permissions', (table) => {
    table.text('admin_did').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('feed_permissions', (table) => {
    table.dropColumn('admin_did');
  });
}
