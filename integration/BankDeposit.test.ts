import { BankDeposit } from "../src/external/database/models/BankDeposit";
import { BankDepositHistoryRecord } from "../src/external/database/models/BankDepositHistoryRecord";
import { DataStore } from "../src/external/DataStore";
import { BankDepositValidityService } from "../src/modules/bank-deposit/validity-checking/BankDepositValidityService";
import { useDataStore, doneWithDataStore } from "./DataStore";

function createData(
	count: number,
): [BankDeposit, BankDepositHistoryRecord[]][] {
	const deposits: [BankDeposit, BankDepositHistoryRecord[]][] = [];
	for (let i = 0; i < count; i++) {
		const history: BankDepositHistoryRecord[] = [];
		for (let j = i - 1; j >= 0; j--) {
			history.push({
				bankGuild: {
					name: "name",
					realm: "realm",
				},
				player: {
					name: `player${j}`,
					realm: "realm",
				},
				copper: j + 1,
			});
		}
		const timestamp = new Date("2020-01-01");
		timestamp.setDate(i + 1);
		deposits.push([
			{
				player: {
					name: `player${i}`,
					realm: "realm",
				},
				timestamp,
				copper: i + 1,
			},
			history,
		]);
	}
	return deposits;
}

describe("bank deposit test data generator", () => {
	it("produces history matching the deposits", () => {
		const data = createData(10);
		expect(data[0][0].copper).toEqual(data[1][1][0].copper);
		expect(data[0][0].copper).toEqual(data[2][1][1].copper);
		expect(data[0][0].copper).toEqual(data[3][1][2].copper);
		expect(data[0][0].copper).toEqual(data[4][1][3].copper);
	});
});

describe("bank deposits", () => {
	let dataStore: DataStore;

	beforeAll(async () => {
		dataStore = useDataStore();
		await dataStore.bankGuilds.addBankGuild("test", {
			name: "name",
			realm: "realm",
		});
	});

	afterAll(async () => {
		await dataStore.bankGuilds.removeBankGuild("test", {
			name: "name",
			realm: "realm",
		});
		doneWithDataStore();
	});

	it("validates good deposits", async () => {
		const addDepositPromises = createData(20).map(([deposit, history]) => {
			return dataStore.bankDeposits.addDeposit(
				"test",
				{
					name: "name",
					realm: "realm",
				},
				deposit,
				history,
			);
		});
		const ids = await Promise.all(addDepositPromises);
		const validityService = new BankDepositValidityService(dataStore);
		await validityService.update();
		const deposit = await dataStore.bankDeposits.getDepositById(ids[0]);
		expect(deposit.validity).toEqual("valid");
	}, 10000);
	// it("invalidates bad deposits", async () => {});
});
