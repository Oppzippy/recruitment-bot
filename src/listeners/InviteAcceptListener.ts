import { Listener } from "discord-akairo";
import { Collection } from "discord.js";
import { Invite } from "discord.js";
import { GuildMember } from "discord.js";
import { HuokanClient } from "../HuokanClient";

export default class InviteAcceptListener extends Listener {
	constructor() {
		super("inviteAccept", {
			emitter: "client",
			event: "guildMemberAdd",
		});
	}

	async exec(member: GuildMember) {
		const client = <HuokanClient>this.client;
		const repo = client.db.recruitmentInviteLinkRepository;
		const oldUsage = await repo.getRecruitmentLinkUsage(member.guild.id);
		const usage = this.getInviteUsage(await member.guild.fetchInvites());
		await repo.setRecruitmentLinkUsage(
			this.getInviteUsageDifference(usage, oldUsage),
		);
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
		invites.forEach((invite, code) => {
			if (oldInvites.get(code) != invites.get(code)) {
				changes.set(code, invites.get(code));
			}
		});
		return changes;
	}
}
