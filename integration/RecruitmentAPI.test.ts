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

	it("gets the invite links used by a user", async () => {
		await dataStore.inviteLinks.addInviteLink(
			"test",
			"testLink2",
			"ownerId2",
		);
		for (let i = 0; i < 5; i++) {
			await dataStore.inviteLinks.logInviteLinkUse(
				"test",
				"testUser2",
				true,
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

	it("gets a user's recruiter", async () => {
		// TODO test with only one invite link use
		await dataStore.inviteLinks.addInviteLink(
			"test",
			"testLink3",
			"ownerId3",
		);
		await dataStore.inviteLinks.addInviteLink(
			"test",
			"testLink4",
			"ownerId4",
		);
		await dataStore.inviteLinks.logInviteLinkUse(
			"test",
			"testUser3",
			true,
			"testLink3",
		);
		await dataStore.inviteLinks.logInviteLinkUse("test", "testUser3", true);
		await dataStore.inviteLinks.logInviteLinkUse(
			"test",
			"testUser3",
			true,
			"testLink4",
		);
		const response = await Axios.get(
			`${apiURL}/v1/recruitment/user/testUser3/recruiter`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			},
		);
		expect(response.data).toMatchObject({
			inviteLink: "testLink3",
			recruiterDiscordId: "ownerId3",
		});
		// TODO test timestamp
		expect(response.data).toHaveProperty("timestamp");
	});

	it("404s when a user hasn't accepted an invite link", async () => {
		await dataStore.inviteLinks.logInviteLinkUse("test", "testUser5", true);
		const response = await Axios.get(
			`${apiURL}/v1/recruitment/user/testUser5/recruiter`,
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
