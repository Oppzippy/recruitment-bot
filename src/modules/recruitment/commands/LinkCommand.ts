import { Command } from "discord-akairo";
import { DiscordAPIError } from "discord.js";
import { User, Guild, TextChannel, Message } from "discord.js";
import { DataStore } from "../../../external/database/DataStore";
import { HuokanClient } from "../../../HuokanClient";

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
				const inviteLink =
					(await this.getInviteLink(message.guild, message.author)) ??
					(await this.createInviteLink(message));

				await message.reply(`https://discord.gg/${inviteLink}`);
			} catch (err) {
				console.log(err);
			}
		}
	}

	private async getInviteLink(guild: Guild, user: User) {
		const repo = this.db.inviteLinks;
		const link = await repo.getRecruitmentInviteLinkByOwner(
			guild.id,
			user.id,
		);
		return link?.inviteLink;
	}

	private async createInviteLink(message: Message) {
		const repo = this.db.inviteLinks;
		const user = message.author;
		const channel = await this.getInviteLinkChannel(message);

		const invite = await channel.createInvite({
			temporary: false,
			maxAge: 0,
			maxUses: 0,
			unique: true,
			reason: `User id ${user.id}'s recruitment invite link`,
		});

		await repo.addRecruitmentInviteLink(
			channel.guild.id,
			invite.code,
			user.id,
		);

		return invite.code;
	}

	private async getInviteLinkChannel(message: Message): Promise<TextChannel> {
		const channelId = await this.getCustomInviteLinkChannel(message.guild);
		if (channelId) {
			try {
				const settingsChannel = await this.client.channels.fetch(
					channelId,
				);
				if (settingsChannel instanceof TextChannel) {
					return settingsChannel;
				}
			} catch (err) {
				if (!(err instanceof DiscordAPIError && err.code != 10008)) {
					console.error(err);
				}
			}
		}
		return <TextChannel>message.channel;
	}

	private async getCustomInviteLinkChannel(guild: Guild): Promise<string> {
		const repo = this.db.settings;
		const channel = await repo.get<string>(guild.id, "invite_channel");
		return channel;
	}
}
