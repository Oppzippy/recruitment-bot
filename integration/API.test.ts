import Axios from "axios";
import { doneWithAPI, useAPI } from "./API";
import { useDataStore, doneWithDataStore } from "./DataStore";

const testDepositString =
	"zZSxCsIwEIZfRW5OIUlbCxlFcHTppDhEDRhM2pC2Qi19d6/gIOIiB9Zsae770jt+MsBRV9dNZ90Z1ACV9gYUbEPoFys8AAbRaOfxW3mJ2jkYGYRobrbumrUJdWPbBtR+gFMdgomgBMeFNU730/ZVebeo/WAc2b/gKQ1f5nM3T/h3au80PKPh8w5ezpo6Ii4kcfZEvCDyovh9cA8MnG5N0z6fwAn7RsDek9dajzbtAxZJLnkiRJLykucqKxTPdnjn4w==";

describe("huokanbot HTTP api", () => {
	let apiURL: string;
	let apiKey: string;
	beforeAll(async () => {
		apiURL = await useAPI();
		const dataStore = useDataStore();
		apiKey = await dataStore.apiKeys.createApiKey("123");
		await dataStore.apiKeys.addGuildPermission(apiKey, "test");
		await dataStore.bankGuilds.addBankGuild("test", {
			name: "Oppy Bank",
			realm: "Thrall",
		});
		doneWithDataStore();
	});

	afterAll(async () => {
		await doneWithAPI();
	});

	it("creates bank deposits", async () => {
		const response = await Axios.post(
			`${apiURL}/v1/bank/deposit`,
			{
				depositString: testDepositString,
			},
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			},
		);
		expect(response.status).toEqual(201);
		expect(response.data).toMatchObject({
			bankGuild: {
				name: "Oppy Bank",
				realm: "Thrall",
			},
			player: {
				name: "Oppzippy",
				realm: "Thrall",
			},
			copper: 10000,
			validity: "unknown",
			timestamp: "2020-11-30T05:47:04.000Z",
		});
	});
});
