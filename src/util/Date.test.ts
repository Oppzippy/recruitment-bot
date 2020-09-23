import { getCycleStartDate } from "./Date";

describe("get cycle start date", () => {
	it("works in the first cycle", () => {
		const startDate = new Date("2020-09-08T08:00:00Z");
		const interval = 7;
		const now = new Date("2020-09-08T08:01:00Z");
		const cycleStartDate = getCycleStartDate(startDate, interval, now);
		expect(cycleStartDate).toEqual(startDate);
	});

	it("works in later cycles", () => {
		const startDate = new Date("2010-06-01T10:00:00Z");
		const interval = 7;
		const now = new Date("2020-09-19T14:00:00Z");
		const cycleStartDate = getCycleStartDate(startDate, interval, now);
		expect(cycleStartDate).toEqual(new Date("2020-09-15T10:00:00Z"));
	});

	it("works seconds before the next cycle", () => {
		const startDate = new Date("2020-09-01T10:00:00Z");
		const interval = 7;
		const now = new Date("2020-09-08T09:59:00Z");
		const cycleStartDate = getCycleStartDate(startDate, interval, now);
		expect(cycleStartDate).toEqual(new Date("2020-09-01T10:00:00Z"));
	});

	it("works on day boundaries (early)", () => {
		const startDate = new Date("2020-09-01T00:00:00Z");
		const interval = 7;
		const now = new Date("2020-09-07T23:59:59Z");
		const cycleStartDate = getCycleStartDate(startDate, interval, now);
		expect(cycleStartDate).toEqual(startDate);
	});

	it("works on day boundaries (late)", () => {
		const startDate = new Date("2020-09-01T23:59:59Z");
		const interval = 7;
		const now = new Date("2020-09-09T00:00:00Z");
		const cycleStartDate = getCycleStartDate(startDate, interval, now);
		expect(cycleStartDate).toEqual(new Date("2020-09-08T23:59:59Z"));
	});

	it("works with negative dates", () => {
		const startDate = new Date("2020-09-15T10:00:00Z");
		const interval = 7;
		const now = new Date("2020-09-14T00:00:00Z");
		const cycleStartDate = getCycleStartDate(startDate, interval, now);
		expect(cycleStartDate).toEqual(new Date("2020-09-08T10:00:00Z"));
	});
});
