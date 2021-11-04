import * as Sentry from "@sentry/node";
import { Listener } from "discord-akairo";
import { Guild, GuildMember } from "discord.js";
import { DataStore } from "../../../external/DataStore";
import { LeaderboardManager } from "../leaderboard/LeaderboardManager";
import Multimap = require("multimap");
import { MessageEmbed } from "discord.js";
import { DiscordAPIError } from "discord.js";
import { InviteLinkTracker } from "../leaderboard/InviteLinkTracker";
import { Constants } from "discord.js";

export class InviteLinkAcceptListener extends Listener {
	private db: DataStore;
	private leaderboardManager: LeaderboardManager;
	private recentJoins = new Multimap<string, GuildMember>();
	private trackers = new Map<string, InviteLinkTracker>();

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
		if (!this.trackers.has(guild.id)) {
			this.trackers.set(
				guild.id,
				new InviteLinkTracker(this.db, guild.id),
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

		await this.leaderboardManager.updateLeaderboardsForGuild(guild);
	}

	private async logInviteLinkUse(
		inviteLink: string | null,
		guildMember: GuildMember,
	) {
		const [isDuplicate, ownerId] = await Promise.all([
			this.db.inviteLinks.hasUserJoinedBefore(guildMember.user.id),
			this.db.inviteLinks.getOwnerId(inviteLink),
			this.db.inviteLinks.logInviteLinkUse(
				guildMember.guild.id,
				guildMember.user.id,
				inviteLink,
			),
		]);
		if (ownerId && !(await this.db.userSettings.get(ownerId, "quiet"))) {
			const owner = await this.client.users.fetch(ownerId);
			const dmChannel = owner.dmChannel ?? (await owner.createDM());
			const embed = new MessageEmbed();
			embed.setTitle(
				`Your invite link ${inviteLink} was used by ${guildMember.user.tag}`,
			);
			embed.setThumbnail(guildMember.user.avatarURL());
			let message = `<@!${guildMember.user.id}> accepted your invite.`;
			if (isDuplicate) {
				message +=
					"  This user has been on the server before, so they will not count towards your score on the invite leaderboard.";
			}
			message += "  Use `!setting quiet` to toggle these messages.";
			embed.setDescription(message);
			try {
				await dmChannel.send({
					embeds: [embed],
				});
			} catch (err) {
				if (
					err instanceof DiscordAPIError &&
					err.code == Constants.APIErrors.CANNOT_MESSAGE_USER
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
