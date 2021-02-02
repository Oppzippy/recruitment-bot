import Knex from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("guild_setting", (table) => {
		table.increments("id").primary();
		table.string("guild_id").notNullable();
		table.string("key").notNullable();
		table.json("value").notNullable();

		table.unique(["guild_id", "key"]);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable("guild_setting");
}
