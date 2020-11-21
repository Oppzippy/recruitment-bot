import { isEqual } from "lodash";
import { isEqual as isDateEqual } from "date-fns";
import { BankGuild } from "./BankGuild";
import { BankDepositHistoryRecord } from "./BankDepositHistoryRecord";

export type BankDeposit = {
	id?: string;
	bankGuild?: BankGuild;
	player: {
		name: string;
		realm: string;
	};
	copper: number;
	timestamp: Date;
	validity?: BankDepositValidity;
	screenshotUrl?: string;
};

export type BankDepositValidity = "valid" | "invalid" | "unknown";

export function bankDepositEquals(
	left: BankDeposit,
	right: BankDeposit,
): boolean {
	if (left.id && right.id) {
		return left.id == right.id;
	}
	return (
		isEqual(left.player, right.player) &&
		isEqual(left.bankGuild, right.bankGuild) &&
		left.copper == right.copper &&
		isDateEqual(left.timestamp, right.timestamp)
	);
}

export function bankDepositEqualsHistoryRecord(
	left: BankDeposit,
	right: BankDepositHistoryRecord,
): boolean {
	return (
		isEqual(left.player, right.player) &&
		isEqual(left.bankGuild, right.bankGuild) &&
		left.copper == right.copper
	);
}
