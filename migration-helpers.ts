import { Knex } from "knex";

export async function createUpdatedAtTrigger(
	knex: Knex,
	table: string,
): Promise<void> {
	if (knex.client?.config?.client == "pg") {
		await knex.raw(
			`CREATE TRIGGER ??
			BEFORE UPDATE
			ON ?? FOR EACH ROW
			EXECUTE PROCEDURE moddatetime(updated_at)`,

			[`${table}_updated_at`, table],
		);
	} else {
		await knex.raw(
			`CREATE TRIGGER ??
			BEFORE UPDATE
			ON ?? FOR EACH ROW
			SET NEW.updated_at = NOW()`,

			[`${table}_updated_at`, table],
		);
	}
}

export async function dropUpdatedAtTrigger(
	knex: Knex,
	table: string,
): Promise<void> {
	if (knex.client?.config?.client == "pg") {
		await knex.raw("DROP TRIGGER ?? ON ??", [`${table}_updated_at`, table]);
	} else {
		await knex.raw("DROP TRIGGER ??", [`${table}_updated_at`]);
	}
}
