import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(
		"recruitment_invite_link_duplicate_change",
		(table) => {
			table.increments("id").primary();
			table.string("invite_link").notNullable();
			table.string("acceptee_discord_id").notNullable();
			table.integer("duplicates").notNullable();
			table.timestamps(true, true);
			table.index(
				["invite_link", "acceptee_discord_id", "created_at"],
				"recruitment_invite_link_duplicate_change_index",
			);
		},
	);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable("recruitment_invite_link_duplicate_change");
}
