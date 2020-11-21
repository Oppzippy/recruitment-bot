import Knex = require("knex");
import NodeCache = require("node-cache");
import { v4 as uuidv4 } from "uuid";
import { BankGuildNotFoundError } from "../errors/BankGuildNotFoundError";
import { KnexRepository } from "../KnexRepository";
import { BankDeposit, BankDepositValidity } from "../models/BankDeposit";
import { BankDepositHistoryRecord } from "../models/BankDepositHistoryRecord";
import { BankDepositRecord } from "../models/BankDepositRecord";
import { BankGuild } from "../models/BankGuild";

type BankDepositFilter = {
	guild?: BankGuild;
	after?: Date;
	before?: Date;
	id?: string;
	discordGuildId?: string;
	validity?: BankDepositValidity;
};

export class BankDepositRepository extends KnexRepository {
	private historyCache: NodeCache;

	public constructor(db: Knex) {
		super(db);
		this.historyCache = new NodeCache({
			stdTTL: 60 * 60 * 8, // 8h
			deleteOnExpire: true,
		});
	}

	/**
	 *  The history array must be ordered newest to oldest!
	 * @param guildId Discord guild id
	 * @param bankGuild Bank guild that the copper was deposited into.
	 * @param deposit Current deposit.
	 * @param history Deposits that occurred before deposit. history[0] should be the deposit immediately before and so on.
	 */
	public async addDeposit(
		guildId: string,
		bankGuild: BankGuild,
		deposit: BankDeposit,
		history: BankDepositHistoryRecord[],
	): Promise<string> {
		const bankGuildRow = await this.db("bank_guild")
			.select("id")
			.where({
				guildId,
				bankGuildName: bankGuild.name,
				bankGuildRealm: bankGuild.realm,
			})
			.first();
		if (!bankGuildRow) {
			throw new BankGuildNotFoundError(
				"Unknown bank guild name or realm",
			);
		}
		const id = uuidv4();
		await this.db.transaction(async (trx) => {
			const [bankDepositId] = await trx("bank_deposit").insert({
				guildId,
				publicId: id,
				bankGuildId: bankGuildRow.id,
				playerName: deposit.player.name,
				playerRealm: deposit.player.realm,
				copper: deposit.copper,
				depositTimestamp: deposit.timestamp,
				screenshotUrl: deposit.screenshotUrl,
			});

			await trx("bank_deposit_history").insert(
				history.map((deposit, i) => ({
					bankDepositId,
					playerName: deposit.player.name,
					playerRealm: deposit.player.realm,
					copper: deposit.copper,
					order: i,
				})),
			);
		});
		return id;
	}

	public async unvalidateDepositsUsing(
		id: string,
		lookahead: number,
	): Promise<void> {
		this.db("bank_deposit")
			.update({
				validity: "unknown",
			})
			.where(
				"deposit_timestamp",
				"<=",
				this.db("bank_deposit")
					.select("deposit_timestamp")
					.where("public_id", "=", id),
			)
			.where(
				"deposit_timestamp",
				">=",
				this.db("bank_deposit")
					.select("deposit_timestamp")
					.where({
						bankGuildId: this.db("bank_deposit")
							.select("bank_guild_id")
							.where("public_id", "=", id),
					})
					.where(
						"created_at",
						"<",
						this.db("bank_deposit")
							.select("deposit_timestamp")
							.where("public_id", "=", id),
					)
					.offset(lookahead)
					.limit(1),
			)
			.where({
				bankGuildId: this.db("bank_deposit")
					.select("bank_guild_id")
					.where("public_id", "=", id),
			});
	}

	public async getDepositById(id: string): Promise<BankDeposit> {
		const deposits = await this.getDeposits({ id });
		return deposits.length == 1 ? deposits[0] : undefined;
	}

	public async getDeposits(
		filter: BankDepositFilter,
	): Promise<BankDeposit[]> {
		const records = await this.getDepositRecords(filter);
		return this.rowToBankDeposit(records);
	}

	private rowToBankDeposit(
		records: ReadonlyArray<BankDepositRecord>,
	): BankDeposit[] {
		return records.map((record) => ({
			id: record.publicId,
			bankGuild: {
				name: record.bankGuildName,
				realm: record.bankGuildRealm,
			},
			player: {
				name: record.playerName,
				realm: record.playerRealm,
			},
			copper: record.copper,
			validity: record.validity,
			timestamp: record.depositTimestamp,
			...(record.screenshotUrl && {
				screenshotUrl: record.screenshotUrl,
			}),
		}));
	}

	public async getDepositsAfter(
		depositId: string,
		limit = 50,
	): Promise<BankDeposit[]> {
		const rows = await this.db("bank_deposit")
			.innerJoin("bank_guild", "bank_guild_id", "=", "bank_guild.id")
			.select<BankDepositRecord[]>([
				"public_id",
				"bank_guild_name",
				"bank_guild_realm",
				"player_name",
				"player_realm",
				"copper",
				"deposit_timestamp",
				"validity",
				"screenshot_url",
			])
			.where({
				bankGuildId: this.db("bank_deposit")
					.select("bank_guild_id")
					.where("public_id", "=", depositId),
			})
			.where(
				"deposit_timestamp",
				">",
				this.db("bank_deposit")
					.select("deposit_timestamp")
					.where("public_id", "=", depositId),
			)
			.orderBy("deposit_timestamp", "asc")
			.limit(limit);

		return this.rowToBankDeposit(rows);
	}

	private async getDepositRecords(
		filter: BankDepositFilter,
	): Promise<BankDepositRecord[]> {
		const query = this.db("bank_deposit")
			.innerJoin("bank_guild", "bank_guild_id", "=", "bank_guild.id")
			.select([
				"public_id",
				"bank_guild_name",
				"bank_guild_realm",
				"player_name",
				"player_realm",
				"copper",
				"deposit_timestamp",
				"validity",
				"screenshot_url",
			]);
		if (filter.after) {
			query.where("deposit_timestamp", ">=", filter.after);
		}
		if (filter.before) {
			query.where("deposit_timestamp", "<", filter.before);
		}
		if (filter.guild) {
			query.where({
				guildBankName: filter.guild.name,
				guildBankRealm: filter.guild.realm,
			});
		}
		if (filter.discordGuildId) {
			query.where({ "bank_guild.guild_id": filter.discordGuildId });
		}
		if (filter.id) {
			query.where("public_id", "=", filter.id);
		}
		if (filter.validity) {
			query.where("validity", "=", filter.validity);
		}

		return await query;
	}

	public async getDepositHistory(
		bankDepositOrId: string | BankDeposit,
	): Promise<BankDepositHistoryRecord[]> {
		const id =
			typeof bankDepositOrId == "string"
				? bankDepositOrId
				: bankDepositOrId.id;
		if (this.historyCache.has(id)) {
			return this.historyCache.get(id);
		}

		const depositHistory = await this.getBankDepositHistoryFromDb(
			typeof bankDepositOrId == "string"
				? await this.getDepositById(bankDepositOrId)
				: bankDepositOrId,
		);

		this.historyCache.set(id, depositHistory);
		return depositHistory;
	}

	private async getBankDepositHistoryFromDb(deposit: BankDeposit) {
		const depositHistoryRows = await this.db("bank_deposit")
			.innerJoin(
				"bank_deposit_history",
				"bank_deposit.id",
				"=",
				"bank_deposit_history.bank_deposit_id",
			)
			.select({
				playerName: "bank_deposit_history.player_name",
				playerRealm: "bank_deposit_history.player_realm",
				copper: "bank_deposit_history.copper",
			})
			.where("public_id", "=", deposit.id)
			.orderBy("order", "asc");

		return depositHistoryRows.map((row) => {
			return {
				bankGuild: deposit.bankGuild,
				player: {
					name: row.playerName,
					realm: row.playerRealm,
				},
				copper: row.copper,
			};
		});
	}

	public async setDepositValidity(
		depositId: string,
		validity: BankDepositValidity,
	): Promise<void> {
		await this.db("bank_deposit")
			.where("public_id", "=", depositId)
			.update({ validity });
	}
}
