import { z } from "zod";
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

const filterSchema = z.object({
	userId: z
		.string()
		.optional()
		.nullable()
		.transform((value) => value ?? undefined),
	startDate: z
		.string()
		.optional()
		.nullable()
		.transform((date) => (date ? parseISO(date) : undefined)),
	resetIntervalInDays: z
		.number()
		.optional()
		.nullable()
		.transform((value) => value ?? undefined),
	endDate: z
		.string()
		.optional()
		.nullable()
		.transform((date) => (date ? parseISO(date) : undefined)),
});

export function parseFilter(filterData: unknown): RecruitmentInviteLinkFilter {
	return filterSchema.parse(filterData);
}
