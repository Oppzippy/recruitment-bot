import { parseISO } from "date-fns";
import { Knex } from "knex";

type InviteLinkData = {
	guilds: {
		guildId: string;
		recruiters: {
			recruiterId: string;
			inviteLinks: {
				inviteCode: string;
				isBanned?: boolean;
				acceptees: {
					accepteeId: string;
					createdAt: string;
					isAccountOldEnough?: boolean;
				}[];
			}[];
		}[];
	}[];
};

type Acceptee = {
	discordId: string;
	createdAt: Date;
	isAccountOldEnough: boolean;
	numUses: number;
	inviteLink: InviteLink;
};

type InviteLink = {
	guildId: string;
	inviteLink: string;
	ownerDiscordId: string;
	isBanned: boolean;
};

export async function insertJoinedWithoutInviteLink(
	knex: Knex,
	acceptees: {
		guildId: string;
		accepteeId: string;
		createdAt: string;
		isAccountOldEnough?: boolean;
	}[],
) {
	await knex("accepted_recruitment_invite_link").insert(
		acceptees.map((acceptee) => ({
			guild_id: acceptee.guildId,
			acceptee_discord_id: acceptee.accepteeId,
			created_at: parseISO(acceptee.createdAt),
			updated_at: parseISO(acceptee.createdAt),
			weight:
				acceptee.isAccountOldEnough ||
				acceptee.isAccountOldEnough == undefined,
		})),
	);
}

export async function insertInviteLinks(knex: Knex, data: InviteLinkData) {
	const inviteLinks: InviteLink[] = [];
	let acceptees: Acceptee[] = [];
	data.guilds.forEach((guild) => {
		guild.recruiters.forEach((recruiter) => {
			recruiter.inviteLinks.forEach((inviteLink) => {
				const inviteLinkAcceptees: Acceptee[] = [];
				const inviteLinkDbRecord = {
					guildId: guild.guildId,
					inviteLink: inviteLink.inviteCode,
					ownerDiscordId: recruiter.recruiterId,
					isBanned: !!inviteLink.isBanned,
				};
				inviteLinks.push(inviteLinkDbRecord);

				inviteLink.acceptees
					// numUses needs to increase over time, so ensure sorted by time for sequential numUses
					.sort(
						(left, right) =>
							parseISO(left.createdAt).getTime() -
							parseISO(right.createdAt).getTime(),
					)
					.forEach((acceptee, i) => {
						inviteLinkAcceptees.push({
							createdAt: parseISO(acceptee.createdAt),
							discordId: acceptee.accepteeId,
							inviteLink: inviteLinkDbRecord,
							isAccountOldEnough:
								acceptee.isAccountOldEnough ||
								acceptee.isAccountOldEnough == undefined,
							numUses: i + 1,
						});
					});
				acceptees = acceptees.concat(inviteLinkAcceptees);
			});
		});
	});
	await knex("recruitment_invite_link").insert(
		inviteLinks.map((inviteLink) => ({
			guild_id: inviteLink.guildId,
			invite_link: inviteLink.inviteLink,
			owner_discord_id: inviteLink.ownerDiscordId,
			// As long as the date isn't used for anything, this just needs to be set to anything
			banned_at: inviteLink.isBanned
				? parseISO("2020-01-01T00:00:00Z")
				: undefined,
		})),
	);
	await Promise.all([
		knex("accepted_recruitment_invite_link").insert(
			acceptees.map((acceptee) => ({
				guild_id: acceptee.inviteLink.guildId,
				acceptee_discord_id: acceptee.discordId,
				created_at: acceptee.createdAt,
				updated_at: acceptee.createdAt,
				invite_link: acceptee.inviteLink.inviteLink,
				weight: acceptee.isAccountOldEnough == false ? 0 : 1,
			})),
		),
		knex("recruitment_invite_link_usage_change").insert(
			acceptees.map((acceptee) => ({
				invite_link: acceptee.inviteLink.inviteLink,
				num_uses: acceptee.numUses,
				created_at: acceptee.createdAt,
				updated_at: acceptee.createdAt,
			})),
		),
	]);
}
