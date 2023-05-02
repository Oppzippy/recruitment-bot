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
	userId: myzod.string().optional().nullable(),
	startDate: myzod
		.string()
		.nullable()
		.optional()
		.map((date) => parseISO(date)),
	resetIntervalInDays: myzod.number().optional().nullable(),
	endDate: myzod
		.string()
		.nullable()
		.optional()
		.map((date) => parseISO(date)),
});

export function parseFilter(filterData: unknown): RecruitmentInviteLinkFilter {
	return filterSchema.parse(filterData);
}
