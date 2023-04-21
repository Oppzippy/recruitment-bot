import { Knex } from "knex";
import { DataStore } from "../src/database/DataStore";
import { useKnexInstance } from "./helper/Knex";
import { KnexDataStore } from "../src/database/KnexDataStore";
import { parseISO } from "date-fns";
import {
	insertInviteLinks,
	insertJoinedWithoutInviteLink,
} from "./helper/InviteLink";

import { expect } from "chai";

describe("recruiter score", function () {
	this.timeout(30000);

	let knex: Knex;
	let dataStore: DataStore;

	beforeEach(async function () {
		knex = await useKnexInstance(this.currentTest?.title);
		dataStore = new KnexDataStore(knex);
	});

	afterEach(function () {
		knex.destroy();
	});

	it("gets scores with duplicates", async function () {
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
		expect(scores.get("1")).to.equal(3);
		expect(scores.get("2")).to.equal(1);
	});

	it("gets scores with duplicates in a range", async function () {
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
		expect(scores.get("1")).to.equal(2);
		expect(scores.get("2")).to.be.undefined;
	});

	it("gets duplicates", async function () {
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
		expect(duplicates.get("1")).to.equal(2);
		expect(duplicates.get("2")).to.equal(1);
	});

	it("doesn't track duplicates after an end date", async function () {
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
		expect(score).to.deep.equal([
			{
				guildId: "1",
				recruiterDiscordId: "1",
				count: 2,
			},
		]);
	});

	it("doesn't subtract duplicates from before the start date", async function () {
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
		expect(score).to.deep.equal([
			{
				guildId: "1",
				recruiterDiscordId: "1",
				count: 1,
			},
		]);
	});

	it("filters duplicates with a start and end date", async function () {
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
		expect(score).to.deep.equal([
			{
				guildId: "1",
				recruiterDiscordId: "1",
				count: 1,
			},
		]);
	});

	it("retrieves all records with no filters", async function () {
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
		expect(new Set(scores)).to.deep.equal(
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

	it("retrieves all records with date filter extremities", async function () {
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
		expect(scores).to.deep.contain({
			guildId: "1",
			recruiterDiscordId: "1",
			count: 1,
		});
	});

	it("doesn't count users that have joined before without an invite link", async function () {
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
		expect(scores).to.deep.contain({
			guildId: "1",
			recruiterDiscordId: "1",
			count: 1,
		});
	});

	it("excludes only banned invite links", async function () {
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
		expect(scores).to.deep.equal([
			{
				guildId: "1",
				recruiterDiscordId: "1",
				count: 1,
			},
		]);
	});

	it("doesn't include accounts that are too young", async function () {
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
		expect(scores).to.deep.equal([
			{
				guildId: "1",
				recruiterDiscordId: "1",
				count: 1,
			},
		]);
	});

	it("filters by guild id", async function () {
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
		expect(scores).to.deep.equal([
			{
				guildId: "1",
				recruiterDiscordId: "1",
				count: 1,
			},
		]);
	});

	it("filters by user id", async function () {
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
		expect(scores).to.deep.equal([
			{
				guildId: "1",
				recruiterDiscordId: "2",
				count: 1,
			},
		]);
	});
});
