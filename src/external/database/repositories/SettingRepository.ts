import { Knex } from "knex";
import { KnexRepository } from "../KnexRepository";

export class SettingRepository extends KnexRepository {
	private settingType: string;

	public constructor(db: Knex, settingType: string) {
		super(db);
		this.settingType = settingType;
	}

	public async set(
		settingGroup: string,
		setting: string,
		value: unknown,
	): Promise<void> {
		await this.db.raw(
			`INSERT INTO setting (setting_type, setting_group, setting, value) VALUES (?, ?, ?, ?)
			ON DUPLICATE KEY UPDATE value = VALUES(value)`,
			[this.settingType, settingGroup, setting, JSON.stringify(value)],
		);
	}

	public async get<T>(settingGroup: string, setting: string): Promise<T> {
		const row = await this.db("setting")
			.select("value")
			.where({ settingType: this.settingType, settingGroup, setting })
			.first();
		return row?.value; // XXX with mysql the json is parsed. mariadb does not parse the json.
	}
}
