import { DataStore } from "../../external/DataStore";
import { HuokanClient } from "../../HuokanClient";
import { Module } from "../Module";
import { UserSettingCommand } from "./commands/UserSettingCommand";

export const VALID_SETTINGS = ["quiet"];

export class SettingModule extends Module {
	public constructor(client: HuokanClient, db?: DataStore) {
		super(client, db);

		this.commandHandler.register(new UserSettingCommand(db));
	}
}
