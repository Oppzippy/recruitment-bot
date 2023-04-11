import { Listener } from "@sapphire/framework";
import * as Sentry from "@sentry/node";
import { GuildMember } from "discord.js";

export class InviteLinkAcceptListener extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			event: "guildMemberAdd",
		});
	}

	public async run(member: GuildMember): Promise<void> {
		const transaction = Sentry.startTransaction({
			name: "InviteAcceptListener.exec",
		});
		this.container.client.recruitmentModule.addRecentJoin(
			member.guild.id,
			member,
		);
		try {
			await this.container.client.recruitmentModule.updateInvites(
				member.guild,
			);
		} catch (err) {
			console.error(err);
			Sentry.captureException(err);
		}
		transaction.finish();
	}
}
