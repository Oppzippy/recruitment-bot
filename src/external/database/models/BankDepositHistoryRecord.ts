import { BankGuild } from "./BankGuild";

export type BankDepositHistoryRecord = {
	bankGuild?: BankGuild;
	player: {
		name: string;
		realm: string;
	};
	copper: number;
};
