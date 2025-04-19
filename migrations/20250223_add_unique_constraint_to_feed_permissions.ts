import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable("feed_permissions", (table) => {
		table.unique(["did", "uri"], {
			indexName: "feed_permissions_did_uri_unique",
			useConstraint: true,
		});
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable("feed_permissions", (table) => {
		table.dropUnique(["did", "uri"], "feed_permissions_did_uri_unique");
	});
}
