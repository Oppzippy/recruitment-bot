import * as Knex from "knex";
import {
	createUpdatedAtTrigger,
	dropUpdatedAtTrigger,
} from "../migration-helpers";

const tables = [
	"accepted_recruitment_invite_link",
	"guild_setting",
	"recruitment_invite_link",
	"recruitment_invite_link_leaderboard",
	"recruitment_invite_link_usage_change",
];

export async function up(knex: Knex): Promise<void> {
	const promises = tables.map((table) => createUpdatedAtTrigger(knex, table));
	await Promise.all(promises);
}

export async function down(knex: Knex): Promise<void> {
	const promises = tables.map((table) => dropUpdatedAtTrigger(knex, table));
	await Promise.all(promises);
}
