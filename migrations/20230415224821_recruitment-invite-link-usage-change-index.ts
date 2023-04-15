import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"recruitment_invite_link_usage_change",
		(table) => {
			table.dropIndex("created_at");
			table.dropIndex("invite_link");
			table.index(
				["invite_link", "created_at", "id", "num_uses"],
				"recruitment_invite_link_usage_change_index",
			);
		},
	);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"recruitment_invite_link_usage_change",
		(table) => {
			table.dropIndex(
				["invite_link", "created_at", "id", "num_uses"],
				"recruitment_invite_link_usage_change_index",
			);
			table.index("created_at");
			table.index("invite_link");
		},
	);
}
