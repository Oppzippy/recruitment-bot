import { compareAsc, parseISO } from "date-fns";
import { Knex } from "knex";
import { memoize } from "lodash";

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
	const acceptees: Acceptee[] = [];

	const memoizedParseISO = memoize((s: string) => parseISO(s));
	for (const guild of data.guilds) {
		for (const recruiter of guild.recruiters) {
			for (const inviteLink of recruiter.inviteLinks) {
				const inviteLinkDbRecord = {
					guildId: guild.guildId,
					inviteLink: inviteLink.inviteCode,
					ownerDiscordId: recruiter.recruiterId,
					isBanned: !!inviteLink.isBanned,
				};
				inviteLinks.push(inviteLinkDbRecord);

				inviteLink.acceptees
					// numUses needs to increase over time, so ensure sorted by time for sequential numUses
					.sort((left, right) => {
						return compareAsc(
							memoizedParseISO(left.createdAt),
							memoizedParseISO(right.createdAt),
						);
					});
				for (let i = 0; i < inviteLink.acceptees.length; i++) {
					const acceptee = inviteLink.acceptees[i];
					acceptees.push({
						createdAt: parseISO(acceptee.createdAt),
						discordId: acceptee.accepteeId,
						inviteLink: inviteLinkDbRecord,
						isAccountOldEnough:
							acceptee.isAccountOldEnough ||
							acceptee.isAccountOldEnough == undefined,
						numUses: i + 1,
					});
				}
			}
		}
	}
	await knex.batchInsert(
		"recruitment_invite_link",
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
		knex.batchInsert(
			"accepted_recruitment_invite_link",
			acceptees.map((acceptee) => ({
				guild_id: acceptee.inviteLink.guildId,
				acceptee_discord_id: acceptee.discordId,
				created_at: acceptee.createdAt,
				updated_at: acceptee.createdAt,
				invite_link: acceptee.inviteLink.inviteLink,
				weight: acceptee.isAccountOldEnough == false ? 0 : 1,
			})),
		),
		knex.batchInsert(
			"recruitment_invite_link_usage_change",
			acceptees.map((acceptee) => ({
				invite_link: acceptee.inviteLink.inviteLink,
				num_uses: acceptee.numUses,
				created_at: acceptee.createdAt,
				updated_at: acceptee.createdAt,
			})),
		),
	]);
}
