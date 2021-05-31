import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(
		"recruitment_invite_link_leaderboard",
		(table) => {
			table.increments("id").primary();
			table.string("guild_id").notNullable().index();
			table.string("channel_id").notNullable().index();
			table.string("message_id").notNullable().unique();
			table.integer("size").notNullable().defaultTo(10);
			table.timestamps(true, true);
		},
	);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable("recruitment_invite_link_leaderboard");
}
