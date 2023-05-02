import * as myzod from "myzod";
import { RecruitmentInviteLinkFilter } from "./RecruitmentInviteLinkFilter";
import { parseISO } from "date-fns";

export type RecruitmentInviteLinkLeaderboard = {
	id: number;
	guildId: string;
	channelId: string;
	messageId: string;
	size: number;
	createdAt: Date;
	updatedAt?: Date;
	filter?: RecruitmentInviteLinkFilter;
};

const filterSchema = myzod.object({
	userId: myzod
		.string()
		.optional()
		.nullable()
		.map((value) => value ?? undefined),
	startDate: myzod
		.string()
		.optional()
		.nullable()
		.map((date) => (date ? parseISO(date) : undefined)),
	resetIntervalInDays: myzod
		.number()
		.optional()
		.nullable()
		.map((value) => value ?? undefined),
	endDate: myzod
		.string()
		.optional()
		.nullable()
		.map((date) => (date ? parseISO(date) : undefined)),
});

export function parseFilter(filterData: unknown): RecruitmentInviteLinkFilter {
	return filterSchema.parse(filterData);
}
