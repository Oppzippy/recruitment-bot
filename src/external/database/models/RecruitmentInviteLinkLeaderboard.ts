import { InviteLinkFilter } from "../repositories/RecruitmentInviteLinkRepository";

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
	filter.startDate = new Date(filter.startDate);
	return filter;
}
