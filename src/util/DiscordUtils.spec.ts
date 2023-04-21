import { parseISO } from "date-fns";
import { snowflakeDate } from "./DiscordUtils";
import { expect } from "chai";

describe("snowflake date", () => {
	it("gets the date a snowflake was created at", () => {
		const date = snowflakeDate(191587255557554177n);
		expect(date).to.eql(parseISO("2016-06-12T16:19:21.244Z"));
	});
});
