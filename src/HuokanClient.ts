import { AkairoClient } from "discord-akairo";
import { ConfigurationFile } from "./configuration-file/ConfigurationFile";
import { DataStore } from "./external/DataStore";
import { RecruitmentModule } from "./modules/recruitment/RecruitmentModule";
import { SettingModule } from "./modules/settings/SettingsModule";

export class HuokanClient extends AkairoClient {
	public readonly configFile: ConfigurationFile;
	public readonly db: DataStore;

	private recruitmentModule: RecruitmentModule;
	private settingModule: SettingModule;

	public constructor(db: DataStore) {
		super(
			{
				ownerID: "191587255557554177",
			},
			{},
		);
		this.db = db;
		this.recruitmentModule = new RecruitmentModule(this, db);
		this.settingModule = new SettingModule(this, this.db);
	}
}
