import { BankDepositValidity } from "./BankDeposit";

export type BankDepositRecord = {
	publicId: string;
	bankGuildName: string;
	bankGuildRealm: string;
	playerName: string;
	playerRealm: string;
	copper: number;
	depositTimestamp: Date;
	validity: BankDepositValidity;
	screenshotUrl?: string;
};
