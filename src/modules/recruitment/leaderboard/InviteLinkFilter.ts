export type InviteLinkFilter = {
	guildId?: string;
	userId?: string;
	startDate?: Date;
	resetIntervalInDays?: number;
	endDate?: Date;
	now?: Date;
};
