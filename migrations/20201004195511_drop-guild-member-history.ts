import * as Knex from "knex";
import { createUpdatedAtTrigger } from "../migration-helpers";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.dropTable("guild_member_history");
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.createTable("guild_member_history", (table) => {
		table.increments().primary();
		table.string("guild_id").notNullable();
		table.string("user_id").notNullable();
		table.timestamps(true, true);
		table.unique(["guild_id", "user_id"]);
	});
	await createUpdatedAtTrigger(knex, "guild_member_history");
}
