import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("banned_user", (table) => {
		table.increments("id").primary();
		table.string("guild_id", 255).notNullable();
		table.string("user_discord_id", 255).notNullable();
		table.timestamps(true, true);
	});
	await knex.schema.alterTable("recruitment_invite_link", (table) => {
		table.timestamp("banned_at").nullable();
		table.dropIndex("guild_id");
		table.dropIndex("owner_discord_id");
		table.index(["guild_id", "banned_at"]);
		table.index(["owner_discord_id", "banned_at"]);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable("recruitment_invite_link", (table) => {
		table.dropIndex(["guild_id", "banned_at"]);
		table.dropIndex(["owner_discord_id", "banned_at"]);
		table.index("guild_id");
		table.index("owner_discord_id");
		table.dropColumn("banned_at");
	});
	await knex.schema.dropTable("banned_user");
}
