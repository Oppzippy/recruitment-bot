import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	if (knex.client?.config?.client == "pg") {
		await knex.raw("CREATE EXTENSION moddatetime");
	}
	await knex.schema
		.createTable("recruitment_invite_link", (table) => {
			table.increments("id").primary();
			table.string("guild_id").index().notNullable();
			table.string("invite_link").unique().notNullable();
			table.string("owner_discord_id").index().notNullable();
			table.timestamps(true, true);
		})
		.createTable("accepted_recruitment_invite_link", (table) => {
			table.increments("id").primary();
			table.string("invite_link").index().notNullable();
			table.string("acceptee_discord_id").unique().notNullable();
			table.timestamps(true, true);
		});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema
		.dropTable("recruitment_invite_link")
		.dropTable("accepted_recruitment_invite_link");
}
