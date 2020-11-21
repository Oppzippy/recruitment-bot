import { KnexRepository } from "../KnexRepository";
import { BankGuild } from "../models/BankGuild";

export class BankGuildRepositry extends KnexRepository {
	public async addBankGuild(
		guildId: string,
		bankGuild: BankGuild,
	): Promise<void> {
		await this.db("bank_guild").insert({
			guildId,
			bankGuildName: bankGuild.name,
			bankGuildRealm: bankGuild.realm,
		});
	}

	public async removeBankGuild(
		guildId: string,
		bankGuild: BankGuild,
	): Promise<void> {
		await this.db("bank_guild")
			.where({
				guildId,
				bankGuildName: bankGuild.name,
				bankGuildRealm: bankGuild.realm,
			})
			.delete();
	}

	public async getBankGuilds(guildId: string): Promise<BankGuild[]> {
		return await this.db("bank_guild")
			.select({
				name: "bank_guild_name",
				realm: "bank_guild_realm",
			})
			.where({ guildId });
	}

	public async bankGuildExists(
		guildId: string,
		bankGuild: BankGuild,
	): Promise<boolean> {
		const foundBankGuild = await this.db("bank_guild")
			.where({
				guildId,
				bankGuildName: bankGuild.name,
				bankGuildRealm: bankGuild.realm,
			})
			.first();
		return !!foundBankGuild;
	}
}
