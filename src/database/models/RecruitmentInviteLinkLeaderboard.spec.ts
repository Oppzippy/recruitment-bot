import { expect } from "chai";
import { parseFilter } from "./RecruitmentInviteLinkLeaderboard";

describe("recruitment invite link leaderboard", () => {
	it("handles null values in filters for end time properly", async function() {
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
