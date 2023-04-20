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
		await this.db("setting")
			.insert({
				setting_type: this.settingType,
				setting_group: settingGroup,
				setting,
				value: JSON.stringify(value),
			})
			.onConflict(["setting_type", "setting_group", "setting"])
			.merge();
	}

	public async get<T>(settingGroup: string, setting: string): Promise<T> {
		const row = await this.db("setting")
			.select("value")
			.where({ settingType: this.settingType, settingGroup, setting })
			.first();
		return row?.value; // With mysql the json is parsed. mariadb does not parse the json.
	}
}
