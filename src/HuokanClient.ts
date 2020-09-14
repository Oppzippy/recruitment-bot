import { AkairoClient, CommandHandler, ListenerHandler } from "discord-akairo";
import * as path from "path";
import { ConfigurationFile } from "./configuration-file/ConfigurationFile";
import { DataStore } from "./external/database/DataStore";
import { RecruitmentModule } from "./modules/recruitment/RecruitmentModule";

export class HuokanClient extends AkairoClient {
	public readonly configFile: ConfigurationFile;
	public readonly db: DataStore;

	private recruitmentModule: RecruitmentModule;

	public constructor(db: DataStore) {
		super(
			{
				ownerID: "191587255557554177",
			},
			{},
		);
		this.recruitmentModule = new RecruitmentModule(this, db);
		this.db = db;
	}
}
