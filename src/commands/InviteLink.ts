import { Command } from "discord-akairo";
import { User } from "discord.js";
import { Guild } from "discord.js";
import { TextChannel } from "discord.js";
import { Message } from "discord.js";
import { HuokanClient } from "../HuokanClient";

export default class InviteLinkCommand extends Command {
	constructor() {
		super("invitelink", {
			aliases: ["invitelink"],
		});
	}

	async exec(message: Message) {
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

	async getInviteLink(guild: Guild, user: User) {
		const repo = this.getHuokanClient().db.recruitmentInviteLinkRepository;
		const link = await repo.getRecruitmentInviteLinkByOwner(
			guild.id,
			user.id,
		);
		return link?.inviteLink;
	}

	async createInviteLink(user: User, channel: TextChannel) {
		const repo = this.getHuokanClient().db.recruitmentInviteLinkRepository;

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

	getHuokanClient(): HuokanClient {
		return <HuokanClient>this.client;
	}
}
