import { v4 as uuidv4 } from "uuid";
import { KnexRepository } from "../KnexRepository";

export class ApiKeyRepository extends KnexRepository {
	public async createApiKey(ownerDiscordId: string): Promise<string> {
		const apiKey = uuidv4();
		await this.db("api_key").insert({
			key: apiKey,
			ownerDiscordId,
		});
		return apiKey;
	}

	public async doesApiKeyExist(apiKey: string): Promise<boolean> {
		const row = await this.db("api_key")
			.count("*", { as: "count" })
			.where({ key: apiKey })
			.first();
		return row["count"] == 1;
	}

	public async doesApiKeyHavePermission(
		apiKey: string,
		guildId: string,
	): Promise<boolean> {
		const row = await this.db("api_key")
			.innerJoin(
				"api_key_guild_permission",
				"api_key.id",
				"=",
				"api_key_guild_permission.api_key_id",
			)
			.count("*", { as: "count" })
			.where({
				"api_key.key": apiKey,
				"api_key_guild_permission.guild_id": guildId,
			})
			.first();
		return row["count"] == 1;
	}

	public async getGuildPermissions(apiKey: string): Promise<string[]> {
		const rows = await this.db("api_key")
			.innerJoin(
				"api_key_guild_permission",
				"api_key.id",
				"=",
				"api_key_guild_permission.api_key_id",
			)
			.select({ guildId: "guild_id" })
			.where("api_key.key", "=", apiKey);
		return rows.map((row) => row.guildId);
	}

	public async addGuildPermission(
		apiKey: string,
		guildId: string,
	): Promise<void> {
		await this.db("api_key_guild_permission").insert({
			apiKeyId: this.db("api_key").select("id").where("key", "=", apiKey),
			guildId,
		});
	}

	public async deleteApiKey(apiKey: string): Promise<void> {
		await this.db.where({ key: apiKey }).delete();
	}
}
