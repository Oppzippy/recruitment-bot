import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"recruitment_invite_link_leaderboard",
		(table) => {
			table.json("filter").nullable();
		},
	);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"recruitment_invite_link_leaderboard",
		(table) => {
			table.dropColumn("filter");
		},
	);
}
