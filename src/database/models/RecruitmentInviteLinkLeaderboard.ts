// TODO add types
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { InviteLinkFilter } from "../../modules/recruitment/leaderboard/InviteLinkFilter";

export type RecruitmentInviteLinkLeaderboard = {
	id: number;
	guildId: string;
	channelId: string;
	messageId: string;
	size: number;
	createdAt: Date;
	updatedAt?: Date;
	filter?: InviteLinkFilter;
};

export function parseFilter(filter: any): InviteLinkFilter {
	if (filter.startDate) {
		filter.startDate = new Date(filter.startDate);
	}
	if (filter.endDate) {
		filter.endDate = new Date(filter.endDate);
	}
	return filter;
}
