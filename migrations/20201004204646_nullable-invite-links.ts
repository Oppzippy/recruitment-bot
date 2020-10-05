import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"accepted_recruitment_invite_link",
		(table) => {
			table.string("invite_link").nullable().alter();
		},
	);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"accepted_recruitment_invite_link",
		(table) => {
			table.string("invite_link").notNullable().alter();
		},
	);
}
