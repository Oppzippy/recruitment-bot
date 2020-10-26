import { dataStore } from "./DataStore";

describe("recruiter score", () => {
	it("doesn't track duplicates with an end date", async () => {
		const score = await dataStore.recruiters.getRecruiterScoreByUser({
			guildId: "guild1",
			endDate: new Date("2020-02-04"),
			userId: "owner1",
		});
		expect(score).toEqual({
			guildId: "guild1",
			recruiterDiscordId: "owner1",
			count: 2,
		});
	});

	it("doesn't subtract duplicates from before the start date", async () => {
		const score = await dataStore.recruiters.getRecruiterScoreByUser({
			guildId: "guild1",
			startDate: new Date("2020-02-02"),
			userId: "owner1",
		});
		expect(score).toEqual({
			guildId: "guild1",
			recruiterDiscordId: "owner1",
			count: 2,
		});
	});

	it("filters duplicates with a start and end date", async () => {
		const score = await dataStore.recruiters.getRecruiterScores({
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
		const scores = await dataStore.recruiters.getRecruiterScores();
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
});

afterAll(async () => {
	dataStore.destroy();
});
