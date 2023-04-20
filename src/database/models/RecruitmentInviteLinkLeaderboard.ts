import { parseISO } from "date-fns";
import * as myzod from "myzod";
import { RecruitmentInviteLinkFilter } from "./RecruitmentInviteLinkFilter";

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
	userId: myzod.string().optional(),
	startDate: myzod.string().optional().map(parseISO),
	resetIntervalInDays: myzod.number().optional(),
	endDate: myzod.string().optional().map(parseISO),
	now: myzod.string().optional().map(parseISO),
});

export function parseFilter(filterData: unknown): RecruitmentInviteLinkFilter {
	return filterSchema.parse(filterData);
}
