import Knex from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema
		.createTable("api_key", (table) => {
			table.increments().primary();
			table.string("key").notNullable().unique();
			table.string("owner_discord_id").nullable().index();
			table.timestamps(true, true);
		})
		.createTable("api_key_guild_permission", (table) => {
			table.increments().primary();
			table
				.integer("api_key_id")
				.unsigned()
				.notNullable()
				.references("id")
				.inTable("api_key");
			table.string("guild_id").notNullable();

			table.unique(["api_key_id", "guild_id"]);
		});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema
		.dropTable("api_key")
		.dropTable("api_key_guild_permission");
}
