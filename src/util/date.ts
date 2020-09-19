import { differenceInCalendarDays, subDays } from "date-fns";

export function getCycleStartDate(
	startDate: Date,
	resetIntervalInDays?: number,
	now?: Date,
): Date {
	if (!resetIntervalInDays) {
		return startDate;
	}
	if (!now) {
		now = new Date();
	}
	const daysSinceStart = differenceInCalendarDays(now, startDate);

	let daysIntoCycle = daysSinceStart % resetIntervalInDays;
	if (daysIntoCycle < 0) {
		daysIntoCycle = resetIntervalInDays - Math.abs(daysIntoCycle);
	}
	const cycleStartDate = subDays(now, daysIntoCycle);
	cycleStartDate.setHours(
		startDate.getHours(),
		startDate.getMinutes(),
		startDate.getSeconds(),
		startDate.getMilliseconds(),
	);
	if (now < cycleStartDate) {
		// The next cycle instead of previous cycle will be chosen if we're on the
		// same day as the cycle change but before the time it changes
		return subDays(cycleStartDate, resetIntervalInDays);
	}
	return cycleStartDate;
}
