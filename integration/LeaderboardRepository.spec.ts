import { Knex } from "knex";
import { useKnexInstance } from "./helper/Knex";
import { parseFilter } from "../src/database/models/RecruitmentInviteLinkLeaderboard";
import { expect } from "chai";

describe("recruiter score", function () {
	this.timeout(30000);

	let knex: Knex;
	// let dataStore: DataStore;

	beforeEach(async function () {
		knex = await useKnexInstance(this.currentTest?.title);
		// dataStore = new KnexDataStore(knex);
	});

	afterEach(function () {
		knex.destroy();
	});

	it("handles null values in filters for end time properly", async function () {
		const filter = parseFilter({
			endDate: null,
			resetIntervalInDays: null,
			startDate: null,
			userId: null,
		});
		expect(filter.endDate).to.be.undefined;
		expect(filter.resetIntervalInDays).to.be.undefined;
		expect(filter.startDate).to.be.undefined;
		expect(filter.userId).to.be.undefined;
	});
});
