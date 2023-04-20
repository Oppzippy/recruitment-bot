import { DataStore } from "../database/DataStore";
import { HuokanClient } from "../HuokanClient";

export abstract class Module {
	protected client: HuokanClient;
	protected db: DataStore;

	public constructor(client: HuokanClient, db?: DataStore) {
		this.client = client;
		this.db = db;
	}
}
