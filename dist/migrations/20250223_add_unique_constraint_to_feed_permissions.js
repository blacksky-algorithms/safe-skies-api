"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('feed_permissions', (table) => {
        table.unique(['did', 'uri'], {
            indexName: 'feed_permissions_did_uri_unique',
            useConstraint: true,
        });
    });
}
async function down(knex) {
    await knex.schema.alterTable('feed_permissions', (table) => {
        table.dropUnique(['did', 'uri'], 'feed_permissions_did_uri_unique');
    });
}
