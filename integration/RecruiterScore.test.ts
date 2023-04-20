import { Knex } from "knex";
import { DataStore } from "../src/database/DataStore";
import { useKnexInstance } from "./helper/Knex";
import { KnexDataStore } from "../src/database/KnexDataStore";
import { parseISO } from "date-fns";
import {
	insertInviteLinks,
	insertJoinedWithoutInviteLink,
} from "./helper/InviteLink";

jest.setTimeout(30000);
describe("recruiter score", () => {
	let knex: Knex;
	let dataStore: DataStore;

	beforeEach(async () => {
		knex = await useKnexInstance();
		dataStore = new KnexDataStore(knex);
	});

	afterEach(() => {
		knex.destroy();
	});

	it("gets scores with duplicates", async () => {
		await insertInviteLinks(knex, {
			guilds: [
				{
					guildId: "1",
					recruiters: [
						{
							recruiterId: "1",
							inviteLinks: [
								{
									inviteCode: "invite1",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T01:00:00Z",
										},
										{
											accepteeId: "1",
											createdAt: "2020-01-01T02:00:00Z",
										},
										{
											accepteeId: "2",
											createdAt: "2020-01-01T03:00:00Z",
										},
									],
								},
							],
						},
						{
							recruiterId: "2",
							inviteLinks: [
								{
									inviteCode: "invite2",
									acceptees: [
										{
											accepteeId: "2",
											createdAt: "2020-01-01T04:00:00Z",
										},
									],
								},
							],
						},
					],
				},
			],
		});
		const scores =
			await dataStore.recruiters.getRecruiterScoresWithDuplicates("1");
		expect(scores.get("1")).toEqual(3);
		expect(scores.get("2")).toEqual(1);
	});

	it("gets scores with duplicates in a range", async () => {
		await insertInviteLinks(knex, {
			guilds: [
				{
					guildId: "1",
					recruiters: [
						{
							recruiterId: "1",
							inviteLinks: [
								{
									inviteCode: "invite1",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T01:00:00Z",
										},
										{
											accepteeId: "1",
											createdAt: "2020-01-01T02:00:00Z",
										},
										{
											accepteeId: "2",
											createdAt: "2020-01-01T03:00:00Z",
										},
									],
								},
							],
						},
						{
							recruiterId: "2",
							inviteLinks: [
								{
									inviteCode: "invite2",
									acceptees: [
										{
											accepteeId: "2",
											createdAt: "2020-01-01T04:00:00Z",
										},
									],
								},
							],
						},
					],
				},
			],
		});
		const scores =
			await dataStore.recruiters.getRecruiterScoresWithDuplicates("1", {
				endDate: parseISO("2020-01-01T03:00:00Z"),
			});
		expect(scores.get("1")).toEqual(2);
		expect(scores.get("2")).toBeUndefined();
	});

	it("gets duplicates", async () => {
		await insertInviteLinks(knex, {
			guilds: [
				{
					guildId: "1",
					recruiters: [
						{
							recruiterId: "1",
							inviteLinks: [
								{
									inviteCode: "invite1",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T01:00:00Z",
										},
										{
											accepteeId: "1",
											createdAt: "2020-01-01T02:00:00Z",
										},
										{
											accepteeId: "2",
											createdAt: "2020-01-01T03:00:00Z",
										},
									],
								},
								{
									inviteCode: "invite3",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T03:00:00Z",
										},
									],
								},
							],
						},
						{
							recruiterId: "2",
							inviteLinks: [
								{
									inviteCode: "invite2",
									acceptees: [
										{
											accepteeId: "2",
											createdAt: "2020-01-01T04:00:00Z",
										},
									],
								},
							],
						},
					],
				},
			],
		});
		const duplicates = await dataStore.recruiters.getRecruiterDuplicates(
			"1",
		);
		expect(duplicates.get("1")).toEqual(2);
		expect(duplicates.get("2")).toEqual(1);
	});

	it("doesn't track duplicates after an end date", async () => {
		await insertInviteLinks(knex, {
			guilds: [
				{
					guildId: "1",
					recruiters: [
						{
							recruiterId: "1",
							inviteLinks: [
								{
									inviteCode: "invite1",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T01:00:00Z",
										},
										{
											accepteeId: "1",
											createdAt: "2020-01-01T03:00:00Z",
										},
										{
											accepteeId: "2",
											createdAt: "2020-01-01T05:00:00Z",
										},
										{
											accepteeId: "3",
											createdAt: "2020-01-01T02:00:00Z",
										},
									],
								},
								{
									inviteCode: "invite3",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T02:00:00Z",
										},
									],
								},
							],
						},
						{
							recruiterId: "2",
							inviteLinks: [
								{
									inviteCode: "invite2",
									acceptees: [
										{
											accepteeId: "2",
											createdAt: "2020-01-01T04:00:00Z",
										},
									],
								},
							],
						},
					],
				},
			],
		});
		const score = await dataStore.recruiters.getRecruiterScores("1", {
			endDate: parseISO("2020-01-01T03:00:00Z"),
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
		await insertInviteLinks(knex, {
			guilds: [
				{
					guildId: "1",
					recruiters: [
						{
							recruiterId: "1",
							inviteLinks: [
								{
									inviteCode: "invite1",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T01:00:00Z",
										},
										{
											accepteeId: "1",
											createdAt: "2020-01-01T02:00:00Z",
										},
										{
											accepteeId: "2",
											createdAt: "2020-01-01T03:00:00Z",
										},
									],
								},
							],
						},
					],
				},
			],
		});
		const score = await dataStore.recruiters.getRecruiterScores("1", {
			startDate: parseISO("2020-01-01T03:00:00Z"),
		});
		expect(score).toEqual([
			{
				guildId: "1",
				recruiterDiscordId: "1",
				count: 1,
			},
		]);
	});

	it("filters duplicates with a start and end date", async () => {
		await insertInviteLinks(knex, {
			guilds: [
				{
					guildId: "1",
					recruiters: [
						{
							recruiterId: "1",
							inviteLinks: [
								{
									inviteCode: "invite1",
									acceptees: [
										// Duplicates before range
										{
											accepteeId: "1",
											createdAt: "2020-01-01T01:00:00Z",
										},
										{
											accepteeId: "1",
											createdAt: "2020-01-01T02:00:00Z",
										},
										{
											accepteeId: "1",
											createdAt: "2020-01-01T03:00:00Z",
										},
										// The invite in range
										{
											accepteeId: "3",
											createdAt: "2020-01-02T01:00:00Z",
										},
										// Duplicates after range
										{
											accepteeId: "1",
											createdAt: "2020-01-03T01:00:00Z",
										},
										{
											accepteeId: "2",
											createdAt: "2020-01-03T02:00:00Z",
										},
										{
											accepteeId: "2",
											createdAt: "2020-01-03T03:00:00Z",
										},
										{
											accepteeId: "2",
											createdAt: "2020-01-03T04:00:00Z",
										},
									],
								},
							],
						},
					],
				},
			],
		});
		const score = await dataStore.recruiters.getRecruiterScores("1", {
			startDate: new Date("2020-01-02T00:00:00Z"),
			endDate: new Date("2020-01-02T10:00:00Z"),
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
		await insertInviteLinks(knex, {
			guilds: [
				{
					guildId: "1",
					recruiters: [
						{
							recruiterId: "1",
							inviteLinks: [
								{
									inviteCode: "invite1",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T01:00:00Z",
										},
									],
								},
								{
									inviteCode: "invite2",
									acceptees: [
										{
											accepteeId: "2",
											createdAt: "2020-01-01T02:00:00Z",
										},
									],
								},
							],
						},
						{
							recruiterId: "2",
							inviteLinks: [
								{
									inviteCode: "invite3",
									acceptees: [
										{
											accepteeId: "3",
											createdAt: "2020-01-01T03:00:00Z",
										},
									],
								},
							],
						},
					],
				},
			],
		});
		const scores = await dataStore.recruiters.getRecruiterScores("1");
		expect(new Set(scores)).toEqual(
			new Set([
				{
					guildId: "1",
					recruiterDiscordId: "1",
					count: 2,
				},
				{
					guildId: "1",
					recruiterDiscordId: "2",
					count: 1,
				},
			]),
		);
	});

	it("retrieves all records with date filter extremities", async () => {
		await insertInviteLinks(knex, {
			guilds: [
				{
					guildId: "1",
					recruiters: [
						{
							recruiterId: "1",
							inviteLinks: [
								{
									inviteCode: "invite1",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T01:00:00Z",
										},
									],
								},
							],
						},
					],
				},
			],
		});
		const scores = await dataStore.recruiters.getRecruiterScores("1", {
			startDate: new Date(0),
			endDate: parseISO("2500-01-01T00:00:00Z"),
		});
		expect(scores).toContainEqual({
			guildId: "1",
			recruiterDiscordId: "1",
			count: 1,
		});
	});

	it("doesn't count users that have joined before without an invite link", async () => {
		insertJoinedWithoutInviteLink(knex, [
			{
				accepteeId: "1",
				guildId: "1",
				createdAt: "2020-01-01T01:00:00Z",
			},
		]);
		await insertInviteLinks(knex, {
			guilds: [
				{
					guildId: "1",
					recruiters: [
						{
							recruiterId: "1",
							inviteLinks: [
								{
									inviteCode: "invite1",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T02:00:00Z",
										},
										{
											accepteeId: "2",
											createdAt: "2020-01-01T03:00:00Z",
										},
									],
								},
							],
						},
					],
				},
			],
		});
		const scores = await dataStore.recruiters.getRecruiterScores("1");
		expect(scores).toContainEqual({
			guildId: "1",
			recruiterDiscordId: "1",
			count: 1,
		});
	});

	it("excludes only banned invite links", async () => {
		await insertInviteLinks(knex, {
			guilds: [
				{
					guildId: "1",
					recruiters: [
						{
							recruiterId: "1",
							inviteLinks: [
								{
									inviteCode: "invite1",
									isBanned: true,
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T02:00:00Z",
										},
									],
								},
								{
									inviteCode: "invite2",
									acceptees: [
										{
											accepteeId: "2",
											createdAt: "2020-01-01T03:00:00Z",
										},
									],
								},
							],
						},
					],
				},
			],
		});
		const scores = await dataStore.recruiters.getRecruiterScores("1");
		expect(scores).toEqual([
			{
				guildId: "1",
				recruiterDiscordId: "1",
				count: 1,
			},
		]);
	});

	it("doesn't include accounts that are too young", async () => {
		await insertInviteLinks(knex, {
			guilds: [
				{
					guildId: "1",
					recruiters: [
						{
							recruiterId: "1",
							inviteLinks: [
								{
									inviteCode: "invite1",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T02:00:00Z",
										},
										{
											accepteeId: "2",
											createdAt: "2020-01-01T03:00:00Z",
											isAccountOldEnough: false,
										},
									],
								},
							],
						},
					],
				},
			],
		});
		const scores = await dataStore.recruiters.getRecruiterScores("1");
		expect(scores).toEqual([
			{
				guildId: "1",
				recruiterDiscordId: "1",
				count: 1,
			},
		]);
	});

	it("filters by guild id", async () => {
		await insertInviteLinks(knex, {
			guilds: [
				{
					guildId: "1",
					recruiters: [
						{
							recruiterId: "1",
							inviteLinks: [
								{
									inviteCode: "invite1",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T01:00:00Z",
										},
									],
								},
							],
						},
					],
				},
				{
					guildId: "2",
					recruiters: [
						{
							recruiterId: "1",
							inviteLinks: [
								{
									inviteCode: "invite2",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T02:00:00Z",
										},
										{
											accepteeId: "1",
											createdAt: "2020-01-01T03:00:00Z",
										},
										{
											accepteeId: "1",
											createdAt: "2020-01-01T04:00:00Z",
										},
									],
								},
							],
						},
						{
							recruiterId: "2",
							inviteLinks: [
								{
									inviteCode: "invite3",
									acceptees: [
										{
											accepteeId: "4",
											createdAt: "2020-01-01T00:00:00Z",
										},
									],
								},
							],
						},
					],
				},
			],
		});
		const scores = await dataStore.recruiters.getRecruiterScores("1");
		expect(scores).toEqual([
			{
				guildId: "1",
				recruiterDiscordId: "1",
				count: 1,
			},
		]);
	});

	it("filters by user id", async () => {
		await insertInviteLinks(knex, {
			guilds: [
				{
					guildId: "1",
					recruiters: [
						{
							recruiterId: "1",
							inviteLinks: [
								{
									inviteCode: "invite1",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T02:00:00Z",
										},
										{
											accepteeId: "1",
											createdAt: "2020-01-01T03:00:00Z",
										},
										{
											accepteeId: "1",
											createdAt: "2020-01-01T04:00:00Z",
										},
									],
								},
							],
						},
						{
							recruiterId: "2",
							inviteLinks: [
								{
									inviteCode: "invite2",
									acceptees: [
										{
											accepteeId: "1",
											createdAt: "2020-01-01T05:00:00Z",
										},
										{
											accepteeId: "2",
											createdAt: "2020-01-01T06:00:00Z",
										},
									],
								},
							],
						},
					],
				},
			],
		});
		const scores = await dataStore.recruiters.getRecruiterScores("1", {
			userId: "2",
		});
		expect(scores).toEqual([
			{
				guildId: "1",
				recruiterDiscordId: "2",
				count: 1,
			},
		]);
	});
});
