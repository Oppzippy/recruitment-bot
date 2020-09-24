import { Command } from "discord-akairo";
import { DiscordAPIError } from "discord.js";
import { User, Guild, TextChannel, Message } from "discord.js";
import { DataStore } from "../../../external/database/DataStore";
import { HuokanClient } from "../../../HuokanClient";
import { isDiscordNotFoundError } from "../../../util/DiscordUtils";

export class LinkCommand extends Command {
	private db: DataStore;

	public constructor(db: DataStore) {
		super("invitelink", {
			aliases: ["invitelink"],
			clientPermissions: ["CREATE_INSTANT_INVITE", "SEND_MESSAGES"],
			channel: "guild",
		});
		this.db = db;
	}

	public async exec(message: Message): Promise<void> {
		if (
			this.client instanceof HuokanClient &&
			message.channel instanceof TextChannel
		) {
			try {
				const inviteLink = await this.getOrCreateInviteLinkFromMessage(
					message,
				);

				await message.reply(`https://discord.gg/${inviteLink}`);
			} catch (err) {
				console.error(err);
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
		const link = await repo.getRecruitmentInviteLinkByOwner(
			guild.id,
			user.id,
		);
		return link?.inviteLink;
	}

	private async createInviteLink(user: User, channel: TextChannel) {
		const repo = this.db.inviteLinks;

		const invite = await channel.createInvite({
			temporary: false,
			maxAge: 0,
			maxUses: 0,
			unique: true,
			reason: `${user.username}#${user.discriminator}'s recruitment invite link`,
		});

		await repo.addRecruitmentInviteLink(
			channel.guild.id,
			invite.code,
			user.id,
		);

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
		const repo = this.db.settings;
		const channel = await repo.get<string>(guild.id, "invite_channel");
		return channel;
	}

	private async inviteLinkExists(invite: string): Promise<boolean> {
		try {
			await this.client.fetchInvite(invite);
			return true;
		} catch (err) {
			if (err instanceof DiscordAPIError && err.code == 10006) {
				// Unknown Invite
				console.error(err);
			}
		}
		return false;
	}
}
