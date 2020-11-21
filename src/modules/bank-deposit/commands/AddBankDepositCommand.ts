import { Command } from "discord-akairo";
import { Message } from "discord.js";
import { promisify } from "util";
import { inflateRaw } from "zlib";
import { BankGuildNotFoundError } from "../../../external/database/errors/BankGuildNotFoundError";
import { BankDeposit } from "../../../external/database/models/BankDeposit";
import { BankDepositHistoryRecord } from "../../../external/database/models/BankDepositHistoryRecord";
import { BankGuild } from "../../../external/database/models/BankGuild";
import { DataStore } from "../../../external/DataStore";
import { WoWMoney } from "../../../util/WoWMoney";
import { bankDepositAddonSchema } from "../schema/BankDepositAddonSchema";
import { BankDepositValidityService } from "../validity-checking/BankDepositValidityService";

const inflateRawPromise = promisify(inflateRaw);

type AddBankDepositCommandArgs = {
	depositInfo: string;
};

export class AddBankDepositCommand extends Command {
	private db: DataStore;
	private validityService: BankDepositValidityService;

	public constructor(db: DataStore) {
		super("adddeposit", {
			aliases: ["adddeposit"],
			args: [
				{
					id: "depositInfo",
					type: "string",
				},
			],
		});

		this.db = db;
		this.validityService = new BankDepositValidityService(db);
	}

	public async exec(
		message: Message,
		args: AddBankDepositCommandArgs,
	): Promise<void> {
		try {
			const {
				latestTransaction,
				previousTransactions,
				bankGuild,
			} = await this.parseDepositInfo(args.depositInfo);

			const transactionId = await this.db.bankDeposits.addDeposit(
				message.guild.id,
				bankGuild,
				latestTransaction,
				previousTransactions,
			);
			const dmChannel = await message.author.createDM();
			const money = new WoWMoney(latestTransaction.copper);
			await Promise.all([
				dmChannel.send(
					`Your guild deposit of ${money.toMinimalString()} has been registered. The transaction id is \`${transactionId}\`.`,
				),
				message.reply("Check your DMs for the transaction id."),
			]);
			this.validityService.update();
		} catch (err) {
			if (err instanceof BankGuildNotFoundError) {
				await message.reply(
					"We don't own the guild that the gold was deposited to. Please let us know if you believe this is an error.",
				);
			} else {
				console.error(
					`Error parsing deposit info from ${message.author.username}`,
					err,
				);
			}
		}
	}

	private async parseDepositInfo(compressedDepositInfo: string) {
		const unvalidatedDepositInfo = JSON.parse(
			await this.decompress(compressedDepositInfo),
		);

		// zod requires strict null checking to be enabled to function properly with required args
		// since we have that disabled, we'll have to do some type casting here. Unsafe but akairo and discord.js
		// are annoying to use with strict null checking.
		const depositInfo = bankDepositAddonSchema.parse(
			unvalidatedDepositInfo,
		);

		return {
			bankGuild: depositInfo.bankGuild as BankGuild,
			latestTransaction: depositInfo.latestTransaction as BankDeposit,
			previousTransactions: depositInfo.previousTransactions as BankDepositHistoryRecord[],
		};
	}

	private async decompress(compressed: string): Promise<string> {
		const compressedBuffer = Buffer.from(compressed, "base64");
		const depositInfoBuffer = await inflateRawPromise(compressedBuffer);
		return depositInfoBuffer.toString();
	}
}
