import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"accepted_recruitment_invite_link",
		(table) => {
			table.dropUnique(["acceptee_discord_id"]);
			table.dropIndex(["invite_link"]);
			table.index(
				["invite_link", "acceptee_discord_id"],
				"accepted_recruitment_invite_link_index",
			);
		},
	);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"accepted_recruitment_invite_link",
		(table) => {
			table.dropIndex(
				["invite_link", "acceptee_discord_id"],
				"accepted_recruitment_invite_link_index",
			);
			table.index(["invite_link"]);
			table.unique(["acceptee_discord_id"]);
		},
	);
}
