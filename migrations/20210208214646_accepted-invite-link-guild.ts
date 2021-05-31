import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"accepted_recruitment_invite_link",
		(table) => {
			table.string("guild_id").nullable().after("invite_link");
			table.index(["guild_id", "acceptee_discord_id"], "aril_guild_id");
		},
	);
	await knex.raw(`DROP PROCEDURE DuplicateInvitesForUser`);
	await knex.raw(`
	CREATE PROCEDURE DuplicateInvitesForUser (
		in_invite_link VARCHAR(255),
		in_acceptee_discord_id VARCHAR(255),
		OUT duplicates INTEGER
	)
	SET duplicates = (
		SELECT
			COUNT(*) AS duplicates
		FROM
			accepted_recruitment_invite_link aril2
		WHERE
			aril2.invite_link = in_invite_link
			AND aril2.acceptee_discord_id = in_acceptee_discord_id
			AND aril2.id != (
				SELECT
					aril.id
				FROM
					recruitment_invite_link ril
				RIGHT JOIN accepted_recruitment_invite_link aril ON
					ril.invite_link = aril.invite_link
				WHERE
					COALESCE(ril.guild_id, aril.guild_id) = (
					SELECT
						ril2.guild_id
					FROM
						recruitment_invite_link ril2
					WHERE
						ril2.invite_link = in_invite_link)
					AND aril.acceptee_discord_id = in_acceptee_discord_id
				ORDER BY
					aril.created_at ASC
					LIMIT 1
			)
	);`);
}

export async function down(knex: Knex): Promise<void> {
	await knex.raw(`DROP PROCEDURE DuplicateInvitesForUser`);
	await knex.raw(`
	CREATE PROCEDURE DuplicateInvitesForUser (
		in_invite_link VARCHAR(255),
		in_acceptee_discord_id VARCHAR(255),
		OUT duplicates INTEGER
	)
	SET duplicates = (
		SELECT
			COUNT(*) AS duplicates
		FROM
			accepted_recruitment_invite_link aril2
		WHERE
			aril2.invite_link = in_invite_link
			AND aril2.acceptee_discord_id = in_acceptee_discord_id
			AND aril2.id != (
				SELECT
					aril.id
				FROM
					recruitment_invite_link ril
				INNER JOIN accepted_recruitment_invite_link aril ON
					ril.invite_link = aril.invite_link
				WHERE
					ril.guild_id = (
					SELECT
						guild_id
					FROM
						recruitment_invite_link ril2
					WHERE
						invite_link = in_invite_link)
					AND aril.acceptee_discord_id = in_acceptee_discord_id
				ORDER BY
					aril.created_at ASC
					LIMIT 1
			)
	);`);
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
