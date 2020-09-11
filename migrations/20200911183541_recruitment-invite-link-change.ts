import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
	knex.schema.createTable("recruitment_invite_link_usage_change", (table) => {
		table.increments("id").primary();
		table.string("invite_link").index().notNullable();
		table.integer("num_uses").notNullable();
		table.timestamps(true, true).index();
	});
}

export async function down(knex: Knex): Promise<void> {
	knex.schema.dropTable("recruitment_invite_link_usage_change");
}
