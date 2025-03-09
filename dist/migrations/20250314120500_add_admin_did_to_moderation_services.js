"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('moderation_services', (table) => {
        // Drop the old column if it's no longer needed.
        table.dropColumn('feed_gen_endpoint');
        // Add a new nullable column "admin_did" to store the administrator's DID for custom services.
        table
            .string('admin_did')
            .nullable()
            .comment('Admin DID for custom feed generation services (e.g. Blacksky)');
    });
}
async function down(knex) {
    await knex.schema.alterTable('moderation_services', (table) => {
        // Remove the admin_did column.
        table.dropColumn('admin_did');
    });
}
