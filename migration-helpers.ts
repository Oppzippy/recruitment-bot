import { Knex } from "knex";

export async function createUpdatedAtTrigger(
	knex: Knex,
	table: string,
): Promise<void> {
	await knex.raw(`
		CREATE TRIGGER \`${table}_updated_at\`
		BEFORE UPDATE
		ON \`${table}\` FOR EACH ROW
		SET NEW.updated_at = NOW()
	`);
}

export async function dropUpdatedAtTrigger(
	knex: Knex,
	table: string,
): Promise<void> {
	await knex.raw(`DROP TRIGGER \`${table}_updated_at\``);
}
