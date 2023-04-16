import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"accepted_recruitment_invite_link",
		(table) => {
			table.string("guild_id").nullable().after("invite_link");
			table.index(["guild_id", "acceptee_discord_id"], "aril_guild_id");
		},
	);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"accepted_recruitment_invite_link",
		(table) => {
			table.dropIndex(
				["guild_id", "acceptee_discord_id"],
				"aril_guild_id",
			);
			table.dropColumn("guild_id");
		},
	);
}
