import * as Sentry from "@sentry/node";
import { Listener } from "discord-akairo";
import { Invite, Guild, GuildMember, Collection } from "discord.js";
import { DataStore } from "../../../external/DataStore";
import { LeaderboardManager } from "../leaderboard/LeaderboardManager";
import Multimap = require("multimap");
import { MessageEmbed } from "discord.js";
import { DiscordAPIError } from "discord.js";

function isInviteEligible(invite: Invite) {
	return invite.createdAt > new Date("2021-01-23T03:37Z") || invite.uses <= 1;
}

export class InviteLinkAcceptListener extends Listener {
	private db: DataStore;
	private leaderboardManager: LeaderboardManager;
	private recentJoins: Multimap<string, GuildMember> = new Multimap();

	public constructor(db: DataStore, leaderboardManager: LeaderboardManager) {
		super("inviteAccept", {
			emitter: "client",
			event: "guildMemberAdd",
		});
		this.db = db;
		this.leaderboardManager = leaderboardManager;
	}

	public async exec(member: GuildMember): Promise<void> {
		const transaction = Sentry.startTransaction({
			name: "InviteAcceptListener.exec",
		});
		this.recentJoins.set(member.guild.id, member);
		try {
			await this.updateInvites(member.guild);
		} catch (err) {
			console.error(err);
			Sentry.captureException(err);
		}
		transaction.finish();
	}

	public async updateInvites(guild: Guild): Promise<void> {
		const invites = await guild.fetchInvites();
		const usage = await this.getUsageDifference(guild, invites);
		const guildRecentJoins = this.recentJoins.get(guild.id) ?? [];
		this.recentJoins.delete(guild.id);

		await this.addInviteLinks(
			[...invites.values()].filter((invite) => usage.has(invite.code)),
		);

		const usedInvites = [...usage.keys()].filter(
			(inviteLink) => invites.get(inviteLink).uses > 0,
		);

		const inviteLink = usedInvites.length == 1 ? usedInvites[0] : null;
		await Promise.all(
			guildRecentJoins.map((member) =>
				this.logInviteLinkUse(inviteLink, member),
			),
		);

		if (!inviteLink) {
			console.warn(
				"Unable to match invite links to users: ",
				[...usage.keys()],
				guildRecentJoins.map(
					(member) =>
						`${member.user.username}#${member.user.discriminator}`,
				),
			);
		}

		await this.updateInviteUsageAndLeaderboards(guild, usage);
	}

	private async addInviteLinks(
		invites: ReadonlyArray<Invite>,
	): Promise<void> {
		// Disqualify invite links created before the release that added this function
		// to avoid a sudden jump if the invite has been used before
		const invitesAfterRelease = invites.filter(isInviteEligible);
		await this.db.inviteLinks.addInviteLinks(
			invitesAfterRelease.map((invite) => ({
				guildId: invite.guild.id,
				inviteLink: invite.code,
				ownerDiscordId: invite.inviter.id,
			})),
		);
	}

	private async getUsageDifference(
		guild: Guild,
		invites: Collection<string, Invite>,
	): Promise<Map<string, number>> {
		const oldUsage = await this.db.inviteLinks.getInviteLinkUsage(guild.id);
		const usage = this.getInviteUsage(invites);
		const usageMinusOldUsage = this.getInviteUsageDifference(
			usage,
			oldUsage,
		);
		// Remove ineligible invites
		usageMinusOldUsage.forEach((_, inviteLink) => {
			if (!isInviteEligible(invites.get(inviteLink))) {
				usageMinusOldUsage.delete(inviteLink);
			}
		});
		return usageMinusOldUsage;
	}

	private async updateInviteUsageAndLeaderboards(
		guild: Guild,
		usage: Map<string, number>,
	): Promise<void> {
		await this.db.inviteLinks.setInviteLinkUsage(usage);
		await this.leaderboardManager.updateLeaderboardsForGuild(guild);
	}

	private getInviteUsage(
		invites: Collection<string, Invite>,
	): Map<string, number> {
		const usage = new Map<string, number>();
		invites.forEach((invite, code) => usage.set(code, invite.uses));
		return usage;
	}

	private getInviteUsageDifference(
		invites: Map<string, number>,
		oldInvites: Map<string, number>,
	): Map<string, number> {
		const changes = new Map<string, number>();
		invites.forEach((uses, code) => {
			if (oldInvites.get(code) != uses) {
				changes.set(code, uses);
			}
		});
		return changes;
	}

	private async logInviteLinkUse(
		inviteLink: string | null,
		guildMember: GuildMember,
	) {
		const isDuplicate = await this.db.inviteLinks.hasUserJoinedBefore(
			guildMember.user.id,
		);
		await this.db.inviteLinks.logInviteLinkUse(
			guildMember.user.id,
			inviteLink,
		);
		const ownerId = await this.db.inviteLinks.getOwnerId(inviteLink);
		if (ownerId && !(await this.db.userSettings.get(ownerId, "quiet"))) {
			const owner = await this.client.users.fetch(ownerId);
			const dmChannel = owner.dmChannel ?? (await owner.createDM());
			const embed = new MessageEmbed();
			embed.setTitle(
				`Your invite link ${inviteLink} was used by ${guildMember.user.username}#${guildMember.user.discriminator}`,
			);
			embed.setThumbnail(guildMember.user.avatarURL());
			let message = `<@!${guildMember.user.id}> accepted your invite.`;
			if (isDuplicate) {
				message +=
					"  This user has been on the server before, so they will not be counted towards your score on the invite leaderboard.";
			}
			message += "  Use `!setting quiet` to toggle these messages.";
			embed.setDescription(message);
			try {
				await dmChannel.send(embed);
			} catch (err) {
				if (err instanceof DiscordAPIError && err.code == 50007) {
					// User is blocking DMs
				} else {
					console.error(err);
					Sentry.captureException(err);
				}
			}
		}
	}
}
