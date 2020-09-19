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
