import { Command } from "discord-akairo";
import { User, Guild, TextChannel, Message } from "discord.js";
import { DataStore } from "../../../external/database/DataStore";
import { HuokanClient } from "../../../HuokanClient";

export default class InviteLinkCommand extends Command {
	private db: DataStore;

	public constructor(db: DataStore) {
		super("invitelink", {
			aliases: ["invitelink"],
			clientPermissions: ["CREATE_INSTANT_INVITE", "SEND_MESSAGES"],
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
					(await this.createInviteLink(
						message.author,
						message.channel,
					));

				await message.reply(`https://discord.gg/${inviteLink}`);
			} catch (err) {
				console.log(err);
			}
		}
	}

	private async getInviteLink(guild: Guild, user: User) {
		const repo = this.db.recruitmentInviteLinkRepository;
		const link = await repo.getRecruitmentInviteLinkByOwner(
			guild.id,
			user.id,
		);
		return link?.inviteLink;
	}

	private async createInviteLink(user: User, channel: TextChannel) {
		const repo = this.db.recruitmentInviteLinkRepository;

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
}
