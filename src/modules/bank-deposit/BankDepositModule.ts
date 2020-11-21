import { DataStore } from "../../external/DataStore";
import { HuokanClient } from "../../HuokanClient";
import { Module } from "../Module";
import { AddBankDepositCommand } from "./commands/AddBankDepositCommand";
import { AddBankGuildCommand } from "./commands/AddBankGuildCommand";
import { ListBankGuildsCommand } from "./commands/ListBankGuildsCommand";

export class BankDepositModule extends Module {
	public constructor(client: HuokanClient, db?: DataStore) {
		super(client, db);

		this.commandHandler.register(new AddBankDepositCommand(db));
		this.commandHandler.register(new AddBankGuildCommand(db));
		this.commandHandler.register(new ListBankGuildsCommand(db));
	}
}
