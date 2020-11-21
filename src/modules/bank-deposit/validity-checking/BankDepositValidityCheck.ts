import {
	BankDeposit,
	bankDepositEqualsHistoryRecord,
} from "../../../external/database/models/BankDeposit";
import { BankDepositHistoryRecord } from "../../../external/database/models/BankDepositHistoryRecord";

/**
 *
 * @param bankDeposit
 * @param history Ordered oldest to newest
 */
export function isBankDepositValid(
	bankDeposit: BankDeposit,
	history: ReadonlyArray<{
		bankDeposit: BankDeposit;
		historyRecords: ReadonlyArray<BankDepositHistoryRecord>;
	}>,
): boolean {
	const goodMatches = history.reduce((accumulator, historyEntry, i) => {
		const relevantRecord = historyEntry.historyRecords.find(
			(record, j) =>
				j <= i && bankDepositEqualsHistoryRecord(bankDeposit, record),
		);
		if (relevantRecord) {
			return accumulator + 1;
		}
		return accumulator;
	}, 0);
	const numInvalidEntries = history.reduce(
		(acc, entry, i) => (entry.historyRecords.length < i ? acc + 1 : acc),
		0,
	);
	return goodMatches >= (history.length - numInvalidEntries) * 0.75;
}
