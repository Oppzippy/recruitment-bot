import * as Knex from "knex";
import { InviteLinkRespository } from "./repositories/InviteLinkRepository";
import { InviteLeaderboardRepository } from "./repositories/InviteLeaderboardRepository";
import { SettingRepository } from "./repositories/SettingRepository";
import { DataStore } from "../DataStore";
import { RecruiterRepository } from "./repositories/RecruiterRepository";
import { BankDepositRepository } from "./repositories/BankDepositRepository";
import { BankGuildRepositry } from "./repositories/BankGuildRepository";
import { ApiKeyRepository } from "./repositories/ApiKeyRepository";

export class KnexDataStore extends DataStore {
	private db: Knex;

	public constructor(db: Knex) {
		super({
			inviteLinks: new InviteLinkRespository(db),
			inviteLeaderboards: new InviteLeaderboardRepository(db),
			guildSettings: new SettingRepository(db, "guild"),
			userSettings: new SettingRepository(db, "user"),
			recruiters: new RecruiterRepository(db),
			bankGuilds: new BankGuildRepositry(db),
			bankDeposits: new BankDepositRepository(db),
			apiKeys: new ApiKeyRepository(db),
		});
		this.db = db;
	}

	public destroy(): void {
		this.db.destroy();
		this.db = null;
	}
}
