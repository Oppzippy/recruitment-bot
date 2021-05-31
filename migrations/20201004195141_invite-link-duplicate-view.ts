import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.raw(`
		CREATE VIEW recruitment_invite_link_duplicates AS
		SELECT ril.invite_link, COUNT(*) AS duplicates
		FROM accepted_recruitment_invite_link AS aril
		INNER JOIN recruitment_invite_link AS ril
		ON ril.invite_link  = aril.invite_link
		WHERE aril.created_at > (
			SELECT aril2.created_at FROM accepted_recruitment_invite_link AS aril2
			INNER JOIN recruitment_invite_link AS ril2
			ON aril2.invite_link = ril2.invite_link
			WHERE aril2.acceptee_discord_id = aril.acceptee_discord_id
			AND ril.guild_id = ril2.guild_id
			ORDER BY aril2.created_at ASC
			LIMIT 1
		)
		GROUP BY aril.invite_link;
	`);
}

export async function down(knex: Knex): Promise<void> {
	await knex.raw("DROP VIEW recruitment_invite_link_duplicates");
}
