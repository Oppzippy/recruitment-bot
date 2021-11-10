import { Knex } from "knex";
import { DataStore } from "../DataStore";
import { ApiKeyRepository } from "./repositories/ApiKeyRepository";
import { InviteLeaderboardRepository } from "./repositories/InviteLeaderboardRepository";
import { InviteLinkRespository } from "./repositories/InviteLinkRepository";
import { RecruiterRepository } from "./repositories/RecruiterRepository";
import { SettingRepository } from "./repositories/SettingRepository";

export class KnexDataStore extends DataStore {
	private db: Knex;

	public constructor(db: Knex) {
		super({
			inviteLinks: new InviteLinkRespository(db),
			inviteLeaderboards: new InviteLeaderboardRepository(db),
			guildSettings: new SettingRepository(db, "guild"),
			userSettings: new SettingRepository(db, "user"),
			recruiters: new RecruiterRepository(db),
			apiKeys: new ApiKeyRepository(db),
		});
		this.db = db;
	}

	public destroy(): void {
		this.db.destroy();
		this.db = null;
	}
}
