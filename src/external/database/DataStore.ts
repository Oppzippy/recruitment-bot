import * as Knex from "knex";
import { RecruitmentInviteLinkRespository } from "./repositories/RecruitmentInviteLinkRepository";
import { InviteLeaderboardRepository } from "./repositories/InviteLeaderboardRepository";
import { SettingRepository } from "./repositories/SettingRepository";

export class DataStore {
	public readonly inviteLinks: RecruitmentInviteLinkRespository;
	public readonly inviteLeaderboards: InviteLeaderboardRepository;
	public readonly settings: SettingRepository;

	private db: Knex;

	public constructor(db: Knex) {
		this.db = db;

		this.inviteLinks = new RecruitmentInviteLinkRespository(db);
		this.inviteLeaderboards = new InviteLeaderboardRepository(db);
		this.settings = new SettingRepository(db);
	}

	public destroy(): void {
		this.db.destroy();
		this.db = null;
	}
}
