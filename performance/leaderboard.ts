import dotenv from "dotenv";
dotenv.config();

import { useKnexInstance } from "../integration/helper/Knex";
import { KnexDataStore } from "../src/external/database/KnexDataStore";
import { insertInviteLinks } from "../integration/helper/InviteLink";
import { addSeconds, formatISO, parseISO } from "date-fns";
import { uniqueId } from "lodash";

async function profile<T>(name: string, f: () => Promise<T>): Promise<T> {
	console.log(`Starting ${name}`);
	const startTime = new Date();
	const result = await f();
	const endTime = new Date();
	console.log(
		`Finished ${name} after ${endTime.getTime() - startTime.getTime()} ms`,
	);
	return result;
}

async function run() {
	const knex = await useKnexInstance("leaderboard-perf");
	const dataStore = new KnexDataStore(knex);

	const data = await profile("create data", async () => {
		const data: Parameters<typeof insertInviteLinks>[1] = {
			guilds: [
				{
					guildId: "1",
					recruiters: [],
				},
			],
		};

		const startDate = parseISO("2020-01-01T00:00:00Z");

		console.log("Building data");

		for (let recruiterId = 0; recruiterId < 2000; recruiterId++) {
			const recruiter: (typeof data)["guilds"][number]["recruiters"][number] =
				{
					recruiterId: recruiterId.toString(),
					inviteLinks: [],
				};
			for (
				let inviteLinkIndex = 0;
				inviteLinkIndex < 10;
				inviteLinkIndex++
			) {
				const inviteLink: (typeof recruiter)["inviteLinks"][number] = {
					inviteCode: `${recruiterId}_${inviteLinkIndex}`,
					acceptees: [],
				};
				for (let i = 0; i < 10; i++) {
					inviteLink.acceptees.push({
						accepteeId: uniqueId(),
						createdAt: formatISO(
							addSeconds(startDate, inviteLinkIndex * 10 + i),
						),
					});
				}
				recruiter.inviteLinks.push(inviteLink);
			}
			data.guilds[0].recruiters.push(recruiter);
		}
		return data;
	});
	await profile("insert data", async () => {
		await insertInviteLinks(knex, data);
	});
	await profile("running basic query", async () => {
		await dataStore.recruiters.getRecruiterScores("1");
	});
	await profile("running date filtered query", async () => {
		await dataStore.recruiters.getRecruiterScores("1", {
			startDate: parseISO("2020-01-01T00:00:04"),
			endDate: parseISO("2020-01-01T00:00:08"),
		});
	});
	knex.destroy();
}

run();
