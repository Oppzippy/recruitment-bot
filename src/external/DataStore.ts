import { ApiKeyRepository } from "./database/repositories/ApiKeyRepository";
import { BankDepositRepository } from "./database/repositories/BankDepositRepository";
import { BankGuildRepositry } from "./database/repositories/BankGuildRepository";
import { InviteLeaderboardRepository } from "./database/repositories/InviteLeaderboardRepository";
import { InviteLinkRespository } from "./database/repositories/InviteLinkRepository";
import { RecruiterRepository } from "./database/repositories/RecruiterRepository";
import { SettingRepository } from "./database/repositories/SettingRepository";

export abstract class DataStore {
	public readonly inviteLinks: InviteLinkRespository;
	public readonly inviteLeaderboards: InviteLeaderboardRepository;
	public readonly guildSettings: SettingRepository;
	public readonly userSettings: SettingRepository;
	public readonly recruiters: RecruiterRepository;
	public readonly bankGuilds: BankGuildRepositry;
	public readonly bankDeposits: BankDepositRepository;
	public readonly apiKeys: ApiKeyRepository;

	public constructor(repositories: {
		inviteLinks: InviteLinkRespository;
		inviteLeaderboards: InviteLeaderboardRepository;
		guildSettings: SettingRepository;
		userSettings: SettingRepository;
		recruiters: RecruiterRepository;
		bankGuilds: BankGuildRepositry;
		bankDeposits: BankDepositRepository;
		apiKeys: ApiKeyRepository;
	}) {
		this.inviteLinks = repositories.inviteLinks;
		this.inviteLeaderboards = repositories.inviteLeaderboards;
		this.guildSettings = repositories.guildSettings;
		this.userSettings = repositories.userSettings;
		this.recruiters = repositories.recruiters;
		this.bankGuilds = repositories.bankGuilds;
		this.bankDeposits = repositories.bankDeposits;
		this.apiKeys = repositories.apiKeys;
	}
}
