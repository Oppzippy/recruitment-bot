import * as Sentry from "@sentry/node";
import {
	DiscordAPIError,
	EmbedBuilder,
	Guild,
	GuildMember,
} from "discord.js";
import { RESTJSONErrorCodes } from "discord-api-types/v10";
import Multimap from "multimap";
import { DataStore } from "../../external/DataStore";
import { HuokanClient } from "../../HuokanClient";
import { Module } from "../Module";
import { InviteLinkTracker } from "./leaderboard/InviteLinkTracker";
import { LeaderboardManager } from "./leaderboard/LeaderboardManager";

export class RecruitmentModule extends Module {
	public readonly leaderboardManager: LeaderboardManager;
	public recentJoins = new Multimap<string, GuildMember>();
	public trackers = new Map<string, InviteLinkTracker>();

	public constructor(client: HuokanClient, db: DataStore) {
		super(client, db);
		this.leaderboardManager = new LeaderboardManager(client, db);

		this.refreshLeaderboards();
	}

	public addRecentJoin(id: string, member: GuildMember) {
		this.recentJoins.set(member.guild.id, member);
	}

	public async refreshLeaderboards(): Promise<void> {
		this.db.inviteLinks.getGuildIds().then(async (guildIds) => {
			for (const guildId of guildIds) {
				try {
					const guild = await this.client.guilds.fetch(guildId);
					await this.updateInvites(guild);
				} catch (err) {
					if (
						!(
							err instanceof DiscordAPIError &&
							err.code == RESTJSONErrorCodes.UnknownMessage
						)
					) {
						console.error(`Error updating guild ${guildId}: `, err);
						Sentry.captureException(err);
					}
				}
			}
		});
	}

	public async updateInvites(guild: Guild): Promise<void> {
		if (!this.trackers.has(guild.id)) {
			this.trackers.set(
				guild.id,
				new InviteLinkTracker(this.client.dataStore, guild.id),
			);
		}
		const tracker = this.trackers.get(guild.id);
		const invites = await guild.invites.fetch();
		const usageDifference = await tracker.addState([...invites.values()]);

		const guildRecentJoins = this.recentJoins.get(guild.id) ?? [];
		this.recentJoins.delete(guild.id);

		const inviteLink =
			usageDifference.size == 1
				? usageDifference.keys().next().value
				: null;
		await Promise.all(
			guildRecentJoins.map((member) =>
				this.logInviteLinkUse(inviteLink, member),
			),
		);

		if (!inviteLink && usageDifference.size > 0) {
			console.warn(
				"Unable to match invite links to users: ",
				[...usageDifference.keys()],
				guildRecentJoins.map((member) => `${member.user.tag}`),
			);
		}

		await this.client.recruitmentModule.leaderboardManager.updateLeaderboardsForGuild(
			guild,
		);
	}

	private async logInviteLinkUse(
		inviteLink: string | null,
		guildMember: GuildMember,
	) {
		const dataStore = this.client.dataStore;
		const [isDuplicate, ownerId] = await Promise.all([
			dataStore.inviteLinks.hasUserJoinedBefore(guildMember.user.id),
			dataStore.inviteLinks.getOwnerId(inviteLink),
			dataStore.inviteLinks.logInviteLinkUse(
				guildMember.guild.id,
				guildMember.user.id,
				inviteLink,
			),
		]);
		if (ownerId && !(await dataStore.userSettings.get(ownerId, "quiet"))) {
			const owner = await this.client.users.fetch(ownerId);
			const dmChannel = owner.dmChannel ?? (await owner.createDM());
			let message = `<@!${guildMember.user.id}> accepted your invite.`;
			if (isDuplicate) {
				message +=
					"  This user has been on the server before, so they will not count towards your score on the invite leaderboard.";
			}
			message += "  Use `!setting quiet` to toggle these messages.";
			const embed = new EmbedBuilder()
				.setTitle(
					`Your invite link ${inviteLink} was used by ${guildMember.user.tag}`,
				)
				.setThumbnail(guildMember.user.avatarURL())
				.setDescription(message);
			try {
				await dmChannel.send({
					embeds: [embed],
				});
			} catch (err) {
				if (
					err instanceof DiscordAPIError &&
					err.code == RESTJSONErrorCodes.CannotSendMessagesToThisUser
				) {
					// User is blocking DMs
				} else {
					console.error(err);
					Sentry.captureException(err);
				}
			}
		}
	}
}
