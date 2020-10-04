import { Listener } from "discord-akairo";
import { Invite, Guild, GuildMember, Collection } from "discord.js";
import { DataStore } from "../../../external/DataStore";
import { LeaderboardManager } from "../leaderboard/LeaderboardManager";
import Multimap = require("multimap");
import { MessageEmbed } from "discord.js";

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
		this.recentJoins.set(member.guild.id, member);
		await this.updateLeaderboardsIfNecessary(member.guild);
	}

	public async updateLeaderboardsIfNecessary(guild: Guild): Promise<void> {
		const usage = await this.getUsageDifference(guild);
		const guildRecentJoins = this.recentJoins.get(guild.id) ?? [];
		this.recentJoins.delete(guild.id);
		const inviteLink = usage.size == 1 ? usage.keys().next().value : null;
		await Promise.all(
			guildRecentJoins.map((member) =>
				this.logInviteLinkUse(inviteLink, member),
			),
		);
		if (!inviteLink && usage.size >= 1) {
			console.log(
				"Unable to match invite links to users: ",
				[...usage.keys()],
				guildRecentJoins.map(
					(member) =>
						`${member.user.username}#${member.user.discriminator}`,
				),
			);
		}
		if (usage.size >= 1) {
			await this.updateInviteUsageAndLeaderboards(guild, usage);
		}
	}

	private async getUsageDifference(
		guild: Guild,
	): Promise<Map<string, number>> {
		const oldUsage = await this.db.inviteLinks.getInviteLinkUsage(guild.id);
		const usage = this.getInviteUsage(await guild.fetchInvites());
		const usageMinusOldUsage = this.getInviteUsageDifference(
			usage,
			oldUsage,
		);
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
			if (oldInvites.has(code) && oldInvites.get(code) != uses) {
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
			dmChannel.send(embed);
		}
	}
}
