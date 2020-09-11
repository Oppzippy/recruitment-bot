import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
	knex.schema.createTable("recruitment_invite_link", (table) => {
		table.increments("id").primary();
		table.string("invite_link").unique().notNullable();
		table.string("owner_discord_id").index().notNullable();
		table.timestamps(true, true);
	});

	knex.schema.createTable("accepted_recruitment_invite_link", (table) => {
		table.increments("id").primary();
		table.string("invite_link").index().notNullable();
		table.string("acceptee_discord_id").unique().notNullable();
		table.timestamps(true, true);
	});
}

export async function down(knex: Knex): Promise<void> {
	knex.schema.dropTable("recruitment_invite_link");
	knex.schema.dropTable("accepted_recruitment_invite_link");
}
