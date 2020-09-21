import * as Knex from "knex";
import { RecruitmentInviteLinkRespository } from "./repositories/RecruitmentInviteLinkRepository";
import { InviteLeaderboardRepository } from "./repositories/InviteLeaderboardRepository";
import { SettingRepository } from "./repositories/SettingRepository";

export class DataStore {
	public readonly recruitmentInviteLinkRepository: RecruitmentInviteLinkRespository;
	public readonly inviteLeaderboardRepository: InviteLeaderboardRepository;
	public readonly settingRepository: SettingRepository;

	private db: Knex;

	public constructor(db: Knex) {
		this.db = db;

		this.recruitmentInviteLinkRepository = new RecruitmentInviteLinkRespository(
			db,
		);
		this.inviteLeaderboardRepository = new InviteLeaderboardRepository(db);
		this.settingRepository = new SettingRepository(db);
	}

	public destroy(): void {
		this.db.destroy();
		this.db = null;
	}
}
