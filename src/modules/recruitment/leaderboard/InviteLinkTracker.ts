import { DataStore } from "../../../external/DataStore";

const ELIGIBILITY_CUTOFF_DATE = new Date("2021-01-23T03:37Z");

export type Invite = {
	code: string;
	createdAt: Date;
	uses: number;
	inviter?: {
		id: string;
	};
};

export class InviteLinkTracker {
	private db: DataStore;
	private guildId: string;
	private forcedEligibleLinks: Set<string> = new Set();
	private prevUsage: Map<string, number> = null;

	public constructor(db: DataStore, guildId: string) {
		this.db = db;
		this.guildId = guildId;
	}

	public async addState(
		invites: ReadonlyArray<Invite>,
	): Promise<Map<string, number>> {
		if (this.prevUsage == null) {
			this.prevUsage = await this.fetchPrevUsage(
				invites.map((invite) => invite.code),
			);
			this.forcedEligibleLinks = new Set(this.prevUsage.keys());
		}
		invites = invites.filter((invite) => this.isInviteEligible(invite));
		const currentUsage = this.getUsageFromInvites(invites);
		const usageDifference = this.getDifference(
			this.prevUsage,
			currentUsage,
		);
		this.insertInvites(
			invites.filter((invite) => usageDifference.has(invite.code)),
		);
		this.updateStoredUsage(currentUsage, new Set(usageDifference.keys()));

		this.prevUsage = currentUsage;
		return usageDifference;
	}

	private isInviteEligible(invite: Invite): boolean {
		return (
			(this.forcedEligibleLinks.has(invite.code) ||
				invite.createdAt > ELIGIBILITY_CUTOFF_DATE) &&
			invite.inviter != undefined
		);
	}

	private getDifference(
		prev: Map<string, number>,
		current: Map<string, number>,
	): Map<string, number> {
		const diff = new Map<string, number>();
		current.forEach((uses, inviteLink) => {
			const prevUses = prev.get(inviteLink);
			if (prevUses != uses && uses > 0) {
				diff.set(inviteLink, prevUses != null ? uses - prevUses : uses);
			}
		});
		return diff;
	}

	private getUsageFromInvites(
		invites: ReadonlyArray<Invite>,
	): Map<string, number> {
		const pairs: [string, number][] = invites.map((invite) => [
			invite.code,
			invite.uses,
		]);
		return new Map(pairs);
	}

	private async fetchPrevUsage(
		invites: ReadonlyArray<string>,
	): Promise<Map<string, number>> {
		return await this.db.inviteLinks.getInviteLinkUsage(
			this.guildId,
			invites,
		);
	}

	private async updateStoredUsage(
		currentUsage: Map<string, number>,
		modifiedInviteLinks: Set<string>,
	) {
		const updates = new Map<string, number>();
		modifiedInviteLinks.forEach((inviteLink) => {
			updates.set(inviteLink, currentUsage.get(inviteLink));
		});
		await this.db.inviteLinks.setInviteLinkUsage(updates);
	}

	private async insertInvites(invites: ReadonlyArray<Invite>) {
		await this.db.inviteLinks.addInviteLinks(
			invites.map((invite) => ({
				guildId: this.guildId,
				inviteLink: invite.code,
				ownerDiscordId: invite.inviter.id,
			})),
		);
	}
}
