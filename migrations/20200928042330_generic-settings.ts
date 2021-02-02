import Knex from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema
		.alterTable("guild_setting", (table) => {
			table.dropUnique(["guild_id", "key"]);
			table.renameColumn("key", "setting");
			table.renameColumn("guild_id", "setting_group");

			table.string("setting_type").notNullable().defaultTo("guild");
			table.unique(["setting_type", "setting_group", "setting"]);
		})
		.renameTable("guild_setting", "setting");
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.renameTable("setting", "guild_setting");
	await knex.schema.alterTable("guild_setting", (table) => {
		table.dropUnique(["setting_type", "setting_group", "setting"]);
		table.dropColumn("setting_type");

		table.renameColumn("setting_group", "guild_id");
		table.renameColumn("setting", "key");
		table.unique(["guild_id", "key"]);
	});
}
