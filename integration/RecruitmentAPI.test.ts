import Axios from "axios";
import { DataStore } from "../src/external/DataStore";
import { doneWithAPI, useAPI } from "./API";
import { useDataStore, doneWithDataStore } from "./DataStore";

describe("huokanbot bank deposit HTTP api", () => {
	let apiURL: string;
	let apiKey: string;
	let dataStore: DataStore;
	beforeAll(async () => {
		apiURL = await useAPI();
		dataStore = useDataStore();
		apiKey = await dataStore.apiKeys.createApiKey("123");
		await dataStore.apiKeys.addGuildPermission(apiKey, "test");
	});

	afterAll(async () => {
		await doneWithAPI();
		doneWithDataStore();
	});

	it("gets invite links", async () => {
		await dataStore.inviteLinks.addInviteLink(
			"test",
			"testLink",
			"ownerId",
		);
		const response = await Axios.get(
			`${apiURL}/v1/recruitment/inviteLink/testLink`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			},
		);
		expect(response.data).toMatchObject({
			inviteLink: "testLink",
			ownerDiscordId: "ownerId",
		});
	});

	it("gets the recruiters of a user", async () => {
		await dataStore.inviteLinks.addInviteLink(
			"test",
			"testLink2",
			"ownerId2",
		);
		for (let i = 0; i < 5; i++) {
			await dataStore.inviteLinks.logInviteLinkUse(
				"testUser2",
				"testLink2",
			);
		}
		const response = await Axios.get(
			`${apiURL}/v1/recruitment/user/testUser2/acceptedInvites`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			},
		);

		expect(response.data).toHaveLength(5);
	});
});
