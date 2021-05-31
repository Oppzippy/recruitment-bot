import { Knex } from "knex";

export class KnexRepository {
	protected db: Knex;

	public constructor(db: Knex) {
		this.db = db;
	}
}
