import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable("guild_member_history", (table) => {
		table.dropUnique(["guild_id", "user_id"]);
		table.index(["guild_id", "user_id"]);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable("guild_member_history", (table) => {
		table.dropIndex(["guild_id", "user_id"]);
		table.unique(["guild_id", "user_id"]);
	});
}
