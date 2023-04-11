import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"accepted_recruitment_invite_link",
		(table) => {
			table
				.integer("weight")
				.defaultTo(1)
				.notNullable()
				.after("acceptee_discord_id");
		},
	);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"accepted_recruitment_invite_link",
		(table) => {
			table.dropColumn("weight");
		},
	);
}
