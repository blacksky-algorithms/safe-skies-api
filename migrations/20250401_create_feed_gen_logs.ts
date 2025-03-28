import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('feed_gen_logs', (table) => {
    table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
    table.text('uri').notNullable();
    table.text('previous').notNullable();
    table.text('current').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.jsonb('metadata');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('feed_gen_logs');
}
