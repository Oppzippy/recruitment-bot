import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.raw(
		"DROP TRIGGER accepted_recruitment_invite_link_duplicate_trigger",
	);
}

export async function down(knex: Knex): Promise<void> {
	await knex.raw(`
	CREATE TRIGGER accepted_recruitment_invite_link_duplicate_trigger
	AFTER INSERT
	ON accepted_recruitment_invite_link FOR EACH ROW
	BEGIN
		CALL DuplicateInvitesForUser(NEW.invite_link, NEW.acceptee_discord_id, @duplicates);
		INSERT INTO recruitment_invite_link_duplicate_change (invite_link, acceptee_discord_id, duplicates, created_at, updated_at)
			SELECT
				NEW.invite_link,
				NEW.acceptee_discord_id,
				@duplicates,
				NEW.created_at,
				NEW.updated_at
			WHERE @duplicates != 0
			OR EXISTS (
				SELECT * FROM recruitment_invite_link_duplicate_change AS rildc
				WHERE rildc.invite_link = NEW.invite_link
				AND rildc.acceptee_discord_id = NEW.acceptee_discord_id
				LIMIT 1
			);
	END`);
}
