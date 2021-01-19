import { Command } from "discord-akairo";
import { Message } from "discord.js";
import { BankGuildNotFoundError } from "../../../external/database/errors/BankGuildNotFoundError";
import { DataStore } from "../../../external/DataStore";
import { WoWMoney } from "../../../util/WoWMoney";
import { BankDepositValidityService } from "../validity-checking/BankDepositValidityService";
import { parseCompressedDepositInfo } from "../schema/DepositInfo";

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
				latestDeposit,
				previousDeposits,
				bankGuild,
			} = await parseCompressedDepositInfo(args.depositInfo);

			const transactionId = await this.db.bankDeposits.addDeposit(
				message.guild.id,
				bankGuild,
				latestDeposit,
				previousDeposits,
			);
			const dmChannel = await message.author.createDM();
			const money = new WoWMoney(latestDeposit.copper);
			// DM can fail if the user has the bot blocked
			await Promise.allSettled([
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
				console.info(
					`Error parsing deposit info from ${message.author.username}`,
					err,
				);
			}
		}
	}
}
