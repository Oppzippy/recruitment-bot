import { parseISO } from "date-fns";
import { snowflakeDate } from "./DiscordUtils";

describe("snowflake date", () => {
	it("gets the date a snowflake was created at", () => {
		const date = snowflakeDate(191587255557554177n);
		expect(date).toEqual(parseISO("2016-06-12T16:19:21.244Z"));
	});
});
