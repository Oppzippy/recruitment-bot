import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"accepted_recruitment_invite_link",
		(table) => {
			table.bigInteger("guild_id").unsigned().alter();
			table
				.bigInteger("acceptee_discord_id")
				.unsigned()
				.notNullable()
				.alter();
		},
	);
	await knex.schema.alterTable("api_key", (table) => {
		table.bigInteger("owner_discord_id").unsigned().alter();
	});
	await knex.schema.alterTable("api_key_guild_permission", (table) => {
		table.bigInteger("guild_id").unsigned().notNullable().alter();
	});
	await knex.schema.alterTable("banned_user", (table) => {
		table.bigInteger("guild_id").unsigned().notNullable().alter();
		table.bigInteger("user_discord_id").unsigned().notNullable().alter();
	});
	await knex.schema.alterTable("recruitment_invite_link", (table) => {
		table.bigInteger("guild_id").unsigned().notNullable().alter();
		table.bigInteger("owner_discord_id").unsigned().notNullable().alter();
	});
	await knex.schema.alterTable(
		"recruitment_invite_link_duplicate_change",
		(table) => {
			table
				.bigInteger("acceptee_discord_id")
				.unsigned()
				.notNullable()
				.alter();
		},
	);
	await knex.schema.alterTable(
		"recruitment_invite_link_leaderboard",
		(table) => {
			table.bigInteger("guild_id").unsigned().notNullable().alter();
			table.bigInteger("channel_id").unsigned().notNullable().alter();
			table.bigInteger("message_id").unsigned().notNullable().alter();
		},
	);
	await knex.schema.alterTable("recruitment_invite_link", (table) => {
		table.bigInteger("guild_id").unsigned().notNullable().alter();
		table.bigInteger("owner_discord_id").unsigned().notNullable().alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(
		"accepted_recruitment_invite_link",
		(table) => {
			table.string("guild_id").alter();
			table.string("acceptee_discord_id").notNullable().alter();
		},
	);
	await knex.schema.alterTable("api_key", (table) => {
		table.string("owner_discord_id").alter();
	});
	await knex.schema.alterTable("api_key_guild_permission", (table) => {
		table.string("guild_id").notNullable().alter();
	});
	await knex.schema.alterTable("banned_user", (table) => {
		table.string("guild_id").notNullable().alter();
		table.string("user_discord_id").notNullable().alter();
	});
	await knex.schema.alterTable("recruitment_invite_link", (table) => {
		table.string("guild_id").notNullable().alter();
		table.string("owner_discord_id").notNullable().alter();
	});
	await knex.schema.alterTable(
		"recruitment_invite_link_duplicate_change",
		(table) => {
			table.string("acceptee_discord_id").notNullable().alter();
		},
	);
	await knex.schema.alterTable(
		"recruitment_invite_link_leaderboard",
		(table) => {
			table.string("guild_id").notNullable().alter();
			table.string("channel_id").notNullable().alter();
			table.string("message_id").notNullable().alter();
		},
	);
	await knex.schema.alterTable("recruitment_invite_link", (table) => {
		table.string("guild_id").notNullable().alter();
		table.string("owner_discord_id").notNullable().alter();
	});
}
