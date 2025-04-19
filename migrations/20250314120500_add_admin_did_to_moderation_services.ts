import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable("moderation_services", (table) => {
		// Drop the old column if it's no longer needed.
		table.dropColumn("feed_gen_endpoint");

		// Add a new nullable column "admin_did" to store the administrator's DID for custom services.
		table
			.string("admin_did")
			.nullable()
			.comment("Admin DID for custom feed generation services (e.g. Blacksky)");
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable("moderation_services", (table) => {
		// Remove the admin_did column.
		table.dropColumn("admin_did");
	});
}
