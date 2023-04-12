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
		const scores =
			await dataStore.recruiters.getRecruiterScoresWithDuplicates("1");
		expect(scores.get("1")).toEqual(9);
	});

	it("gets scores with duplicates in a range", async () => {
		const scores =
			await dataStore.recruiters.getRecruiterScoresWithDuplicates("1", {
				endDate: new Date("2020-02-02"),
			});
		expect(scores.get("1")).toEqual(4);
	});

	it("gets duplicates", async () => {
		const duplicates = await dataStore.recruiters.getRecruiterDuplicates(
			"1",
		);
		expect(duplicates.get("1")).toEqual(6);
	});

	it("doesn't track duplicates with an end date", async () => {
		const score = await dataStore.recruiters.getRecruiterScores("1", {
			endDate: new Date("2020-02-04"),
			userId: "1",
		});
		expect(score).toEqual([
			{
				guildId: "1",
				recruiterDiscordId: "1",
				count: 2,
			},
		]);
	});

	it("doesn't subtract duplicates from before the start date", async () => {
		const score = await dataStore.recruiters.getRecruiterScores("1", {
			startDate: new Date("2020-02-02"),
			userId: "1",
		});
		expect(score).toEqual([
			{
				guildId: "1",
				recruiterDiscordId: "1",
				count: 2,
			},
		]);
	});

	it("filters duplicates with a start and end date", async () => {
		const score = await dataStore.recruiters.getRecruiterScores("1", {
			startDate: new Date("2020-02-02"),
			endDate: new Date("2020-02-04"),
		});
		expect(score).toEqual([
			{
				guildId: "1",
				recruiterDiscordId: "1",
				count: 1,
			},
		]);
	});

	it("retrieves all records with no filters", async () => {
		const scores = await dataStore.recruiters.getRecruiterScores("1");
		expect(scores).toContainEqual({
			guildId: "1",
			recruiterDiscordId: "1",
			count: 3,
		});
		expect(scores).toContainEqual({
			guildId: "1",
			recruiterDiscordId: "2",
			count: 2,
		});
		expect(scores).toHaveLength(2);
	});

	it("retrieves all records with date filter extremities", async () => {
		const scores = await dataStore.recruiters.getRecruiterScores("1", {
			startDate: new Date(0),
			endDate: new Date("2100-01-01"),
		});
		expect(scores).toContainEqual({
			guildId: "1",
			recruiterDiscordId: "1",
			count: 3,
		});
	});

	it("doesn't count users that have joined before without an invite link", async () => {
		const scores = await dataStore.recruiters.getRecruiterScores("3");
		expect(scores).toContainEqual({
			guildId: "3",
			recruiterDiscordId: "4",
			count: 1,
		});
	});

	// TODO move to separate test suite
	it("gets invite links by owner without erroring", async () => {
		await expect(
			dataStore.inviteLinks.getInviteLinkByOwner("", ""),
		).resolves.toBeUndefined();
	});

	it("excludes only banned invite links", async () => {
		const scores = await dataStore.recruiters.getRecruiterScores("4");
		expect(scores.length).toEqual(1);
		expect(scores[0].count).toEqual(1);
	});

	it("doesn't subtract invites that weren't counted to begin with", async () => {
		const scores = await dataStore.recruiters.getRecruiterScores("1", {
			startDate: new Date("2020-02-04"),
			userId: "1",
		});
		expect(scores[0].count).toEqual(1);
	});

	it("doesn't include accounts that are too young", async () => {
		const scores = await dataStore.recruiters.getRecruiterScores("5", {
			userId: "6",
		});
		expect(scores[0].count).toEqual(1);
	});
});
