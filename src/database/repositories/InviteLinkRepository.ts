import * as Sentry from "@sentry/node";
import { RecruitmentInviteLink } from "../models/RecruitmentInviteLink";
import { KnexRepository } from "../KnexRepository";

export class InviteLinkRespository extends KnexRepository {
	public async getGuildIds(): Promise<string[]> {
		const rows = await this.db("recruitment_invite_link")
			.select("guild_id")
			.distinct();
		return rows.map((row) => row.guildId);
	}

	public async getGuildIdsOfUser(userId: string): Promise<string[]> {
		const rows = await this.db("recruitment_invite_link")
			.select("guild_id")
			.distinct()
			.where("owner_discord_id", "=", userId);
		return rows.map((row) => row.guildId);
	}

	public async getOwnerId(inviteLink: string): Promise<string> {
		const row = await this.db("recruitment_invite_link")
			.select<RecruitmentInviteLink>("owner_discord_id")
			.where({ inviteLink })
			.first();
		return row?.ownerDiscordId;
	}

	public async logInviteLinkUse(
		guildId: string,
		userId: string,
		isAccountOldEnough: boolean,
		inviteLink?: string,
	): Promise<void> {
		try {
			await this.db("accepted_recruitment_invite_link").insert({
				accepteeDiscordId: userId,
				inviteLink: inviteLink,
				guildId: guildId,
				weight: isAccountOldEnough ? 1 : 0,
			});
		} catch (err) {
			if (err.sqlState == 40001) {
				// XXX Deadlock, retry. Is this still necessary? Unsure if deadlocks can still occur.
				Sentry.captureMessage(
					"Deadlock occurred in logInviteLinkUse, retrying.",
				);
				await new Promise((resolve) => setTimeout(resolve, 2000));
				await this.logInviteLinkUse(
					guildId,
					userId,
					isAccountOldEnough,
					inviteLink,
				);
			} else {
				throw err;
			}
		}
	}

	public async getUserAcceptedInviteLinks(
		guildId: string,
		userId: string,
	): Promise<
		{
			inviteLink: string;
			timestamp: Date;
		}[]
	> {
		const query = this.db({ aril: "accepted_recruitment_invite_link" })
			.innerJoin(
				{ ril: "recruitment_invite_link" },
				"ril.invite_link",
				"=",
				"aril.invite_link",
			)
			.select({
				inviteLink: "ril.invite_link",
				timestamp: "aril.created_at",
			})
			.where("ril.guild_id", "=", guildId)
			.andWhere("aril.acceptee_discord_id", "=", userId)
			.orderBy("aril.created_at", "asc")
			.orderBy("aril.id", "asc");
		return await query;
	}

	public async hasUserJoinedBefore(userId: string): Promise<boolean> {
		const row = await this.db("accepted_recruitment_invite_link")
			.select({
				count: this.db.count("*"),
			})
			.where({ accepteeDiscordId: userId })
			.first();
		return row && row.count >= 1;
	}

	public async addInviteLink(
		guildId: string,
		inviteLink: string,
		ownerId: string,
		numUses = 0,
	): Promise<void> {
		await this.db("recruitment_invite_link").insert({
			guildId,
			inviteLink,
			ownerDiscordId: ownerId,
		});
		await this.db("recruitment_invite_link_usage_change").insert({
			inviteLink,
			numUses,
		});
	}

	public async addInviteLinks(
		inviteLinks: ReadonlyArray<{
			guildId: string;
			inviteLink: string;
			ownerDiscordId: string;
		}>,
	): Promise<void> {
		if (inviteLinks.length > 0) {
			await this.db("recruitment_invite_link")
				.insert(inviteLinks)
				.onConflict("invite_link")
				.ignore();
		}
	}

	public async getInviteLink(
		guildId: string,
		inviteLink: string,
	): Promise<RecruitmentInviteLink> {
		return await this.db("recruitment_invite_link")
			.select<RecruitmentInviteLink>([
				"invite_link",
				"owner_discord_id",
				"created_at",
				"updated_at",
			])
			.where({
				guildId,
				inviteLink,
			})
			.first();
	}

	public async setInviteLinkUsage(usage: Map<string, number>): Promise<void> {
		if (usage.size > 0) {
			const insert = [];
			usage.forEach((numUses, inviteLink) => {
				insert.push({
					inviteLink,
					numUses,
				});
			});
			await this.db("recruitment_invite_link_usage_change").insert(
				insert,
			);
		}
	}

	public async getInviteLinkUsage(
		guildId: string,
		filterInviteLinks?: ReadonlyArray<string>,
	): Promise<Map<string, number>> {
		const query = this.db
			.select({
				id: "id",
				inviteLink: "invite_link",
				createdAt: "created_at",
				numUses: this.getNumUsesSubquery(),
			})
			.where("guild_id", "=", guildId)
			.from("recruitment_invite_link");
		if (filterInviteLinks) {
			query.whereIn("invite_link", filterInviteLinks);
		}
		const links = await query;
		const usageByLink = new Map<string, number>();
		links.forEach((link) => usageByLink.set(link.inviteLink, link.numUses));
		return usageByLink;
	}

	private getNumUsesSubquery() {
		return this.db
			.select("num_uses")
			.from({ num_uses_subtable: "recruitment_invite_link_usage_change" })
			.whereRaw(
				"num_uses_subtable.invite_link = recruitment_invite_link.invite_link",
			)
			.orderBy("created_at", "desc")
			.limit(1);
	}
}
