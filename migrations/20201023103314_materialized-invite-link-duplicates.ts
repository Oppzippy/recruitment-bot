import Knex from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(
		"recruitment_invite_link_duplicate_change",
		(table) => {
			table.increments("id").primary();
			table.string("invite_link").notNullable();
			table.string("acceptee_discord_id").notNullable();
			table.integer("duplicates").notNullable();
			table.timestamps(true, true);
			table.index(
				["invite_link", "acceptee_discord_id", "created_at"],
				"recruitment_invite_link_duplicate_change_index",
			);
		},
	);

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

	// Auto update duplicate invites table
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

	await knex.raw(`
	INSERT
		INTO
		recruitment_invite_link_duplicate_change (invite_link, acceptee_discord_id, duplicates, created_at, updated_at)
	SELECT
		ril.invite_link,
		aril.acceptee_discord_id,
		((
		SELECT
			COUNT(*)
		FROM
			accepted_recruitment_invite_link aril2
		WHERE
			aril2.invite_link = aril.invite_link
			AND aril2.acceptee_discord_id = aril.acceptee_discord_id
			AND aril2.created_at <= aril.created_at ) - IF((
		SELECT
			ril2.invite_link
		FROM
			accepted_recruitment_invite_link aril3
		INNER JOIN recruitment_invite_link ril2 ON
			aril3.invite_link = ril2.invite_link
		WHERE
			ril2.guild_id = ril.guild_id
			AND aril3.acceptee_discord_id = aril.acceptee_discord_id
		ORDER BY
			aril3.created_at ASC
		LIMIT 1 ) = aril.invite_link, 1, 0) ) AS duplicates,
		aril.created_at,
		aril.created_at AS updated_at
	FROM
		accepted_recruitment_invite_link aril
	INNER JOIN recruitment_invite_link ril ON
		ril.invite_link = aril.invite_link
	HAVING
		duplicates > 0
	ORDER BY
		aril.created_at ASC;`);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable("recruitment_invite_link_duplicate_change");
	await knex.raw("DROP PROCEDURE DuplicateInvitesForUser");
	await knex.raw(
		"DROP TRIGGER accepted_recruitment_invite_link_duplicate_trigger",
	);
}
