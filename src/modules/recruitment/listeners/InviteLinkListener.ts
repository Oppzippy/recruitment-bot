import { Listener } from "discord-akairo";
import { Invite, Guild, GuildMember, Collection } from "discord.js";
import { DataStore } from "../../../external/database/DataStore";
import { LeaderboardManager } from "../leaderboard/LeaderboardManager";

export class InviteLinkListener extends Listener {
	private db: DataStore;
	private leaderboardManager: LeaderboardManager;

	public constructor(db: DataStore, leaderboardManager: LeaderboardManager) {
		super("inviteAccept", {
			emitter: "client",
			event: "guildMemberAdd",
		});
		this.db = db;
		this.leaderboardManager = leaderboardManager;
	}

	public async exec(member: GuildMember): Promise<void> {
		await this.updateLeaderboardsIfNecessary(member.guild);
	}

	public async updateLeaderboardsIfNecessary(guild: Guild): Promise<void> {
		const repo = this.db.inviteLinks;
		const oldUsage = await repo.getRecruitmentLinkUsage(guild.id);
		const usage = this.getInviteUsage(await guild.fetchInvites());
		const usageMinusOldUsage = this.getInviteUsageDifference(
			usage,
			oldUsage,
		);
		if (usageMinusOldUsage.size != 0) {
			await repo.setRecruitmentLinkUsage(usageMinusOldUsage);
			this.leaderboardManager.updateLeaderboardsForGuild(guild);
		}
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
}
