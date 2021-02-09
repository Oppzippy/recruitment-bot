import { DataStore } from "../src/external/DataStore";
import { useDataStore, doneWithDataStore } from "./DataStore";

describe("recruiter score", () => {
	let dataStore: DataStore;

	beforeAll(() => {
		dataStore = useDataStore();
	});

	afterAll(() => {
		doneWithDataStore();
	});

	it("gets scores with duplicates", async () => {
		const scores = await dataStore.recruiters.getRecruiterScoresWithDuplicates(
			"guild1",
		);
		expect(scores.get("owner1")).toEqual(9);
	});

	it("gets scores with duplicates in a range", async () => {
		const scores = await dataStore.recruiters.getRecruiterScoresWithDuplicates(
			"guild1",
			{ endDate: new Date("2020-02-02") },
		);
		expect(scores.get("owner1")).toEqual(4);
	});

	it("gets duplicates", async () => {
		const duplicates = await dataStore.recruiters.getRecruiterDuplicates(
			"guild1",
		);
		expect(duplicates.get("owner1")).toEqual(6);
	});

	it("doesn't track duplicates with an end date", async () => {
		const score = await dataStore.recruiters.getRecruiterScores("guild1", {
			endDate: new Date("2020-02-04"),
			userId: "owner1",
		});
		expect(score).toEqual([
			{
				guildId: "guild1",
				recruiterDiscordId: "owner1",
				count: 2,
			},
		]);
	});

	it("doesn't subtract duplicates from before the start date", async () => {
		const score = await dataStore.recruiters.getRecruiterScores("guild1", {
			startDate: new Date("2020-02-02"),
			userId: "owner1",
		});
		expect(score).toEqual([
			{
				guildId: "guild1",
				recruiterDiscordId: "owner1",
				count: 2,
			},
		]);
	});

	it("filters duplicates with a start and end date", async () => {
		const score = await dataStore.recruiters.getRecruiterScores("guild1", {
			startDate: new Date("2020-02-02"),
			endDate: new Date("2020-02-04"),
		});
		expect(score).toEqual([
			{
				guildId: "guild1",
				recruiterDiscordId: "owner1",
				count: 1,
			},
		]);
	});

	it("retrieves all records with no filters", async () => {
		const scores = await dataStore.recruiters.getRecruiterScores("guild1");
		expect(scores).toContainEqual({
			guildId: "guild1",
			recruiterDiscordId: "owner1",
			count: 3,
		});
		expect(scores).toContainEqual({
			guildId: "guild1",
			recruiterDiscordId: "owner2",
			count: 2,
		});
		expect(scores).toHaveLength(2);
	});

	it("doesn't count users that have joined before without an invite link", async () => {
		const scores = await dataStore.recruiters.getRecruiterScores("guild3");
		expect(scores).toContainEqual({
			guildId: "guild3",
			recruiterDiscordId: "owner4",
			count: 1,
		});
	});

	// TODO move to separate test suite
	it("gets invite links by owner without erroring", async () => {
		await expect(
			dataStore.inviteLinks.getInviteLinkByOwner("", ""),
		).resolves.toBeUndefined();
	});
});
