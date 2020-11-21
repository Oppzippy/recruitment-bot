import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema
		.createTable("bank_guild", (table) => {
			table.increments("id").primary();
			table.string("guild_id").notNullable();
			table.string("bank_guild_name").notNullable();
			table.string("bank_guild_realm").notNullable();
			table.timestamps(true, true);

			table.unique(["guild_id", "bank_guild_name", "bank_guild_realm"]);
		})
		.createTable("bank_deposit", (table) => {
			table.increments("id").primary();
			table.string("public_id").unique().notNullable();
			table.string("guild_id").notNullable();
			table.integer("bank_guild_id").notNullable();
			table.string("player_name").notNullable();
			table.string("player_realm").notNullable();
			table.integer("copper").notNullable();
			table.timestamp("deposit_timestamp").notNullable();
			table.string("screenshot_url").nullable();
			table.string("validity").notNullable().defaultTo("unknown");
			table.string("validity_override").nullable();
			table.timestamps(true, true);

			table.index(["guild_id", "bank_guild_id", "deposit_timestamp"]);
		});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable("bank_deposit").dropTable("bank_guild");
}
