import Axios from "axios";
import { DataStore } from "../src/external/DataStore";
import { Knex } from "knex";
import { useKnexInstance } from "./helper/Knex";
import { KnexDataStore } from "../src/external/database/KnexDataStore";
import { HuokanAPI } from "../src/HuokanAPI";

describe("recruitment HTTP api", () => {
	let apiURL: string;
	let api: HuokanAPI;
	let apiKey: string;
	let dataStore: DataStore;
	let knexInstance: Knex;

	beforeEach(async () => {
		knexInstance = await useKnexInstance();
		dataStore = new KnexDataStore(knexInstance);

		api = new HuokanAPI(dataStore);
		apiURL = await api.listen(0);

		apiKey = await dataStore.apiKeys.createApiKey("123");
		await dataStore.apiKeys.addGuildPermission(apiKey, "10");
	});

	afterEach(async () => {
		api.destroy();
		await knexInstance.destroy();
	});

	it("gets invite links", async () => {
		await dataStore.inviteLinks.addInviteLink("10", "testLink", "1");
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
			ownerDiscordId: "1",
		});
	});

	it("gets the invite links used by a user", async () => {
		await dataStore.inviteLinks.addInviteLink("10", "testLink2", "2");
		for (let i = 0; i < 5; i++) {
			await dataStore.inviteLinks.logInviteLinkUse(
				"10",
				"2",
				true,
				"testLink2",
			);
		}
		const response = await Axios.get(
			`${apiURL}/v1/recruitment/user/2/acceptedInvites`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			},
		);

		expect(response.data).toHaveLength(5);
	});

	it("gets a user's recruiter", async () => {
		// TODO test with only one invite link use
		await dataStore.inviteLinks.addInviteLink("10", "testLink3", "3");
		await dataStore.inviteLinks.addInviteLink("10", "testLink4", "4");
		await dataStore.inviteLinks.logInviteLinkUse(
			"10",
			"3",
			true,
			"testLink3",
		);
		await dataStore.inviteLinks.logInviteLinkUse("10", "3", true);
		await dataStore.inviteLinks.logInviteLinkUse(
			"10",
			"3",
			true,
			"testLink4",
		);
		const response = await Axios.get(
			`${apiURL}/v1/recruitment/user/3/recruiter`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			},
		);
		expect(response.data).toMatchObject({
			inviteLink: "testLink3",
			recruiterDiscordId: "3",
		});
		// TODO test timestamp
		expect(response.data).toHaveProperty("timestamp");
	});

	it("404s when a user hasn't accepted an invite link", async () => {
		await dataStore.inviteLinks.logInviteLinkUse("10", "5", true);
		const response = await Axios.get(
			`${apiURL}/v1/recruitment/user/5/recruiter`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
				validateStatus: () => true,
			},
		);
		expect(response.status).toEqual(404);
	});

	it("404s for unknown users", async () => {
		const response = await Axios.get(
			`${apiURL}/v1/recruitment/user/unknownTestUser/recruiter`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
				validateStatus: () => true,
			},
		);
		expect(response.status).toEqual(404);
	});
});
