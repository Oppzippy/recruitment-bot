import { Listener } from "discord-akairo";
import { Collection } from "discord.js";
import { Invite } from "discord.js";
import { GuildMember } from "discord.js";
import { DataStore } from "../../../external/database/DataStore";

export default class InviteAcceptListener extends Listener {
	private db: DataStore;

	constructor(db: DataStore) {
		super("inviteAccept", {
			emitter: "client",
			event: "guildMemberAdd",
		});
		this.db = db;
	}

	async exec(member: GuildMember) {
		const repo = this.db.recruitmentInviteLinkRepository;
		const oldUsage = await repo.getRecruitmentLinkUsage(member.guild.id);
		const usage = this.getInviteUsage(await member.guild.fetchInvites());
		const diff = this.getInviteUsageDifference(usage, oldUsage);
		if (diff.size == 0) {
			await repo.setRecruitmentLinkUsage(diff);
		}
	}

	getInviteUsage(invites: Collection<string, Invite>): Map<string, number> {
		const usage = new Map<string, number>();
		invites.forEach((invite, code) => usage.set(code, invite.uses));
		return usage;
	}

	getInviteUsageDifference(
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
}
