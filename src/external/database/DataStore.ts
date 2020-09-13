import * as Knex from "knex";
import { RecruitmentInviteLinkRespository } from "./repositories/RecruitmentInviteLinkRepository";
import { InviteLeaderboardRepository } from "./repositories/InviteLeaderboardRepository";

export class DataStore {
	public readonly recruitmentInviteLinkRepository: RecruitmentInviteLinkRespository;
	public readonly inviteLeaderboardRepository: InviteLeaderboardRepository;

	private db: Knex;

	constructor(db: Knex) {
		this.db = db;

		this.recruitmentInviteLinkRepository = new RecruitmentInviteLinkRespository(
			db,
		);
		this.inviteLeaderboardRepository = new InviteLeaderboardRepository(db);
	}

	destroy() {
		this.db.destroy();
		this.db = null;
	}
}
