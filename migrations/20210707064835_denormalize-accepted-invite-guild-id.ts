import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex({ aril: "accepted_recruitment_invite_link" })
		.update(
			"aril.guild_id",
			knex({ ril: "recruitment_invite_link" })
				.select("ril.guild_id")
				.whereRaw("ril.invite_link = aril.invite_link"),
		)
		.whereNull("aril.guild_id");
}

export async function down(knex: Knex): Promise<void> {
	await knex("accepted_recruitment_invite_link")
		.update({
			guild_id: null,
		})
		.whereNotNull("invite_link");
}
