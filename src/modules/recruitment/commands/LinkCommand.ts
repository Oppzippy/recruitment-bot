import { Command } from "discord-akairo";
import { Invite } from "discord.js";
import { User, Guild, TextChannel, Message } from "discord.js";
import { DataStore } from "../../../external/DataStore";
import { HuokanClient } from "../../../HuokanClient";
import { isDiscordNotFoundError } from "../../../util/DiscordUtils";

type LinkCommandArgs = {
	inviteLink: Invite;
};

export class LinkCommand extends Command {
	private db: DataStore;

	public constructor(db: DataStore) {
		super("invitelink", {
			aliases: ["invitelink"],
			clientPermissions: ["CREATE_INSTANT_INVITE", "SEND_MESSAGES"],
			channel: "guild",
			args: [
				{
					id: "inviteLink",
					type: "invite",
				},
			],
		});
		this.db = db;
	}

	public async exec(message: Message, args: LinkCommandArgs): Promise<void> {
		if (
			this.client instanceof HuokanClient &&
			message.channel instanceof TextChannel
		) {
			if (!args.inviteLink) {
				message.reply(
					"You must create an invite link yourself, preferably set to never expire, and provide it to this command to register it for the recruitment leaderboard. Example usage: `!invitelink https://discord.gg/yourinvitecode`",
				);
				return;
			}
			if (args.inviteLink.inviter?.id != message.author.id) {
				message.reply("You must create your own invite link.");
				return;
			}
			if (
				await this.db.inviteLinks.getInviteLink(
					args.inviteLink.guild.id,
					args.inviteLink.code,
				)
			) {
				message.reply(
					`The invite link ${args.inviteLink.code} has already been registered and ready to use.`,
				);
				return;
			}
			const guildInvites = await message.guild.fetchInvites();
			const inviteLink = guildInvites.get(args.inviteLink.code);
			if (!inviteLink) {
				message.reply(
					`You must use an invite link for ${message.guild.name}.`,
				);
				return;
			}
			if (inviteLink.uses > 0) {
				message.reply(
					"This invite link has been used before. Please create a new invite link to register here.",
				);
				return;
			}
			if (inviteLink.temporary) {
				message.reply(
					"Temporary membership invite links may not be used.",
				);
				return;
			}
			await this.db.inviteLinks.addInviteLink(
				inviteLink.guild.id,
				inviteLink.code,
				inviteLink.inviter.id,
				inviteLink.uses,
			);
			if (inviteLink.maxAge > 0 || inviteLink.maxUses > 0) {
				message.reply(
					`Invite link ${inviteLink.code} has been added. This invite link will expire. It is okay to use, but we recommend using permanent invite links to ensure expired links are never sent to those being recruited.`,
				);
			} else {
				message.reply(`Invite link ${inviteLink.code} has been added.`);
			}
		}
	}

	private async getOrCreateInviteLinkFromMessage(
		message: Message,
	): Promise<string> {
		const cachedInviteLink = await this.getInviteLink(
			message.guild,
			message.author,
		);
		if (
			cachedInviteLink &&
			(await this.inviteLinkExists(cachedInviteLink))
		) {
			return cachedInviteLink;
		}
		const defaultChannel = await this.getDefaultInviteLinkChannel(
			message.guild,
		);
		return this.createInviteLink(
			message.author,
			defaultChannel ?? <TextChannel>message.channel,
		);
	}

	private async getInviteLink(guild: Guild, user: User) {
		const repo = this.db.inviteLinks;
		const link = await repo.getInviteLinkByOwner(guild.id, user.id);
		return link?.inviteLink;
	}

	private async createInviteLink(user: User, channel: TextChannel) {
		const repo = this.db.inviteLinks;

		const invite = await channel.createInvite({
			temporary: true,
			maxAge: 0,
			maxUses: 0,
			unique: true,
			reason: `${user.username}#${user.discriminator}'s recruitment invite link`,
		});

		await repo.addInviteLink(channel.guild.id, invite.code, user.id);

		return invite.code;
	}

	private async getDefaultInviteLinkChannel(
		guild: Guild,
	): Promise<TextChannel> {
		const channelId = await this.getCustomInviteLinkChannel(guild);
		if (channelId) {
			try {
				const settingsChannel = await this.client.channels.fetch(
					channelId,
				);
				if (settingsChannel instanceof TextChannel) {
					return settingsChannel;
				}
			} catch (err) {
				if (!isDiscordNotFoundError(err)) {
					console.error(err);
				}
			}
		}
		return null;
	}

	private async getCustomInviteLinkChannel(guild: Guild): Promise<string> {
		const repo = this.db.guildSettings;
		const channel = await repo.get<string>(guild.id, "invite_channel");
		return channel;
	}

	private async inviteLinkExists(invite: string): Promise<boolean> {
		try {
			await this.client.fetchInvite(invite);
			return true;
		} catch (err) {
			if (!isDiscordNotFoundError(err)) {
				console.error(err);
			}
		}
		return false;
	}
}
