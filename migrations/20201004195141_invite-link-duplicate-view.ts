import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.raw(`
		CREATE VIEW recruitment_invite_link_duplicates AS
		SELECT invite_link, COUNT(*) AS duplicates
		FROM accepted_recruitment_invite_link AS ril
		WHERE ril.created_at > (
			SELECT created_at FROM accepted_recruitment_invite_link AS rilc
			WHERE rilc.acceptee_discord_id = ril.acceptee_discord_id
			ORDER BY created_at ASC
			LIMIT 1
		)
		GROUP BY ril.invite_link;
	`);
}

export async function down(knex: Knex): Promise<void> {
	await knex.raw("DROP VIEW invite_link_duplicates");
}
