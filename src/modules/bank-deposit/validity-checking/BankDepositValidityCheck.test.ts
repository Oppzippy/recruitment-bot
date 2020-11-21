import { v4 as uuidv4 } from "uuid";
import { BankDeposit } from "../../../external/database/models/BankDeposit";
import { BankDepositHistoryRecord } from "../../../external/database/models/BankDepositHistoryRecord";
import { isBankDepositValid } from "./BankDepositValidityCheck";

function createExampleDeposit(): BankDeposit {
	return {
		copper: Math.round(Math.random() * 100000) + 1,
		player: {
			name: uuidv4(),
			realm: uuidv4(),
		},
		bankGuild: {
			name: uuidv4(),
			realm: uuidv4(),
		},
		timestamp: new Date(),
		id: uuidv4(),
		validity: "unknown",
	};
}

function createExampleHistoryRecord(
	fromBankDeposit?: BankDeposit,
): BankDepositHistoryRecord {
	return {
		player: {
			name: fromBankDeposit?.player.name ?? uuidv4(),
			realm: fromBankDeposit?.player.realm ?? uuidv4(),
		},
		bankGuild: {
			name: fromBankDeposit?.bankGuild.name ?? uuidv4(),
			realm: fromBankDeposit?.bankGuild.realm ?? uuidv4(),
		},
		copper:
			fromBankDeposit?.copper ?? Math.round(Math.random() * 100000) + 1,
	};
}

function createHistoryRecords(
	correctDeposit?: BankDeposit,
	correctDepositIndex?: number,
): BankDepositHistoryRecord[] {
	const history = [];
	for (let i = 0; i < 50; i++) {
		history[i] = createExampleHistoryRecord(
			i == correctDepositIndex ? correctDeposit : undefined,
		);
	}
	return history;
}

function createFullHistory(deposit: BankDeposit, accuracy = 1) {
	const history: {
		bankDeposit: BankDeposit;
		historyRecords: BankDepositHistoryRecord[];
	}[] = [];
	const numRecords = 50;
	for (let i = 0; i < numRecords; i++) {
		history[i] = {
			bankDeposit: createExampleDeposit(),
			historyRecords: createHistoryRecords(
				deposit,
				i < numRecords * accuracy ? i : undefined,
			),
		};
	}
	return history;
}

describe("bank deposit validity check", () => {
	it("validates proper deposits", () => {
		const deposit = createExampleDeposit();
		const history = createFullHistory(deposit);
		const result = isBankDepositValid(deposit, history);
		expect(result).toEqual(true);
	});
	it("validates correct deposits with slightly altered history", () => {
		const deposit = createExampleDeposit();
		const history = createFullHistory(deposit, 0.9);
		const result = isBankDepositValid(deposit, history);
		expect(result).toEqual(true);
	});
	it("doesn't validate mostly incorrect deposits", () => {
		const deposit = createExampleDeposit();
		const history = createFullHistory(deposit, 0.25);
		const result = isBankDepositValid(deposit, history);
		expect(result).toEqual(false);
	});
	it("doesn't validate fully invalid deposits", () => {
		const deposit = createExampleDeposit();
		const history = createFullHistory(deposit, 0);
		const result = isBankDepositValid(deposit, history);
		expect(result).toEqual(false);
	});
	it("doesn't invalidate good deposits because of an extra bad one", () => {
		const deposit = createExampleDeposit();
		const history = createFullHistory(deposit);
		const fakeDeposit = createExampleDeposit();
		history.unshift({
			bankDeposit: fakeDeposit,
			historyRecords: createHistoryRecords(),
		});
		const result = isBankDepositValid(deposit, history);
		expect(result).toEqual(true);
	});
});
