import { promisify } from "util";
import { inflateRaw } from "zlib";
import { BankDeposit } from "../../../external/database/models/BankDeposit";
import { BankDepositHistoryRecord } from "../../../external/database/models/BankDepositHistoryRecord";
import { BankGuild } from "../../../external/database/models/BankGuild";
import { bankDepositAddonSchema } from "./BankDepositAddonSchema";

const inflateRawPromise = promisify(inflateRaw);

export type DepositInfo = {
	bankGuild: BankGuild;
	latestDeposit: BankDeposit;
	previousDeposits: BankDepositHistoryRecord[];
};

export async function parseCompressedDepositInfo(
	compressedDepositInfo: string,
): Promise<DepositInfo> {
	const unvalidatedDepositInfo = JSON.parse(
		await decompress(compressedDepositInfo),
	);
	return parseDepositInfo(unvalidatedDepositInfo);
}

export function parseDepositInfo(unvalidatedDepositInfo: unknown): DepositInfo {
	// zod requires strict null checking to be enabled to function properly with required args
	// since we have that disabled, we'll have to do some type casting here. Unsafe but akairo and discord.js
	// are annoying to use with strict null checking.
	const depositInfo = bankDepositAddonSchema.parse(unvalidatedDepositInfo);

	return {
		bankGuild: depositInfo.bankGuild as BankGuild,
		latestDeposit: depositInfo.latestDeposit as BankDeposit,
		previousDeposits: depositInfo.previousDeposits as BankDepositHistoryRecord[],
	};
}

async function decompress(compressed: string): Promise<string> {
	const compressedBuffer = Buffer.from(compressed, "base64");
	const depositInfoBuffer = await inflateRawPromise(compressedBuffer);
	return depositInfoBuffer.toString();
}
