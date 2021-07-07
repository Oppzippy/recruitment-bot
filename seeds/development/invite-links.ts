import { Knex } from "knex";
import { eachHourOfInterval, subMonths } from "date-fns";

export async function seed(knex: Knex): Promise<void> {
	await knex("recruitment_invite_link").del();
	await knex("accepted_recruitment_invite_link").del();
	await knex("recruitment_invite_link_usage_change").del();
	await knex("recruitment_invite_link_duplicate_change").del();

	await createInviteLinks(knex, 100000);
}

async function createInviteLinks(knex: Knex, usage: number) {
	const interval: Interval = {
		start: subMonths(Date.now(), 12),
		end: Date.now(),
	};
	const hoursOfInterval = eachHourOfInterval(interval);
	const usagePerHour = usage / hoursOfInterval.length;
	const usesForLinks = new Map<string, number>();

	let currentUsage = 0;
	let i = 0;
	for (const time of hoursOfInterval) {
		currentUsage += usagePerHour;
		for (; currentUsage >= 1; currentUsage--) {
			const inviteLink = (i++ % 50).toString();
			if (!usesForLinks.has(inviteLink)) {
				await addInviteLink(knex, inviteLink);
			}
			usesForLinks.set(
				inviteLink,
				(usesForLinks.get(inviteLink) ?? 0) + 1,
			);
			await addOne(knex, inviteLink, usesForLinks.get(inviteLink), time);
		}
	}
}

async function addOne(
	knex: Knex,
	inviteLink: string,
	uses: number,
	time: Date,
) {
	await Promise.all([
		knex("accepted_recruitment_invite_link").insert({
			invite_link: inviteLink,
			acceptee_discord_id: createDiscordId(),
			created_at: time,
			updated_at: time,
		}),
		knex("recruitment_invite_link_usage_change").insert({
			invite_link: inviteLink,
			num_uses: uses,
			created_at: time,
			updated_at: time,
		}),
	]);
}

function createDiscordId(): string {
	const isDuplicate = Math.random() < 0.05;
	if (isDuplicate) {
		return Math.floor(Math.random() * 10).toString();
	} else {
		return Math.random().toString();
	}
}

async function addInviteLink(knex: Knex, inviteLink: string) {
	await knex("recruitment_invite_link").insert({
		guild_id: "guild1",
		invite_link: inviteLink,
		owner_discord_id: `owner${inviteLink}`,
	});
}
