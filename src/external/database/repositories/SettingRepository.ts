import Knex = require("knex");

export class SettingRepository {
	private db: Knex;

	public constructor(db: Knex) {
		this.db = db;
	}

	public async set(
		guildId: string,
		key: string,
		value: unknown,
	): Promise<void> {
		await this.db.raw(
			`INSERT INTO guild_setting (guild_id, \`key\`, value) VALUES (?, ?, ?)
			ON DUPLICATE KEY UPDATE value = VALUES(value)`,
			[guildId, key, JSON.stringify(value)],
		);
	}

	public async get<T>(guildId: string, key: string): Promise<T> {
		const row = await this.db("guild_setting")
			.select("value")
			.where({ guildId, key })
			.first();
		return row?.value; // XXX with mysql the json is parsed. mariadb does not parse the json.
	}
}
