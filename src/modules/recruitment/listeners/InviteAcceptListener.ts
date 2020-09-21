import { Listener } from "discord-akairo";
import { Invite, Guild, GuildMember, Collection } from "discord.js";
import { DataStore } from "../../../external/database/DataStore";

export class InviteAcceptListener extends Listener {
	private db: DataStore;

	public constructor(db: DataStore) {
		super("inviteAccept", {
			emitter: "client",
			event: "guildMemberAdd",
		});
		this.db = db;
	}

	public async exec(member: GuildMember): Promise<void> {
		await this.updateLeaderboardsIfNecessary(member.guild);
	}

	public async updateLeaderboardsIfNecessary(guild: Guild): Promise<void> {
		const repo = this.db.recruitmentInviteLinkRepository;
		const oldUsage = await repo.getRecruitmentLinkUsage(guild.id);
		const usage = this.getInviteUsage(await guild.fetchInvites());
		const diff = this.getInviteUsageDifference(usage, oldUsage);
		if (diff.size != 0) {
			await repo.setRecruitmentLinkUsage(diff);
			this.fireUpdateLeaderboardsEvent(guild.id);
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

	private fireUpdateLeaderboardsEvent(guildId: string): void {
		// TODO get the recruitmentModule emitter in here some other way
		this.handler.emitters
			.get("recruitmentModule")
			.emit("updateLeaderboard", guildId);
	}
}
