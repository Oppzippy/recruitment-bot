import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable("guild_setting", (table) => {
		table.timestamps(true, true);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable("guild_setting", (table) => {
		table.dropColumns("created_at", "updated_at");
	});
}
