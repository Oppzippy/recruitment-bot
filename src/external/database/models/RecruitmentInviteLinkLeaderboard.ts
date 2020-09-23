import { InviteLinkFilter } from "../../../modules/recruitment/leaderboard/InviteLinkFilter";

export interface RecruitmentInviteLinkLeaderboard {
	id: number;
	guildId: string;
	channelId: string;
	messageId: string;
	size: number;
	createdAt: Date;
	updatedAt?: Date;
	filter?: InviteLinkFilter;
}

export function parseFilter(filterJSON: string): InviteLinkFilter {
	const filter = JSON.parse(filterJSON);
	if (filter.startDate) {
		filter.startDate = new Date(filter.startDate);
	}
	if (filter.endDate) {
		filter.endDate = new Date(filter.endDate);
	}
	return filter;
}
