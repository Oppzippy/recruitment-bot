import * as Knex from "knex";
import { RecruitmentInviteLinkRespository } from "./repositories/RecruitmentInviteLinkRepository";

export class DataStore {
	public readonly recruitmentInviteLinkRepository: RecruitmentInviteLinkRespository;

	private db: Knex;

	constructor(db: Knex) {
		this.db = db;

		this.recruitmentInviteLinkRepository = new RecruitmentInviteLinkRespository(
			db,
		);
	}

	destroy() {
		this.db.destroy();
		this.db = null;
	}
}
