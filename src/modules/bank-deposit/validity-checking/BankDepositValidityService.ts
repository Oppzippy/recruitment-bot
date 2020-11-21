import { BankDeposit } from "../../../external/database/models/BankDeposit";
import { BankDepositHistoryRecord } from "../../../external/database/models/BankDepositHistoryRecord";
import { DataStore } from "../../../external/DataStore";
import { isBankDepositValid } from "./BankDepositValidityCheck";

export class BankDepositValidityService {
	private readonly lookahead = 4;
	private db: DataStore;
	private isUpdateInProgress = false;
	private isUpdateQueued = false;

	public constructor(db: DataStore) {
		this.db = db;
	}

	public async update(): Promise<void> {
		if (this.isUpdateInProgress) {
			this.isUpdateQueued = true;
			return;
		}
		this.isUpdateInProgress = true;
		await this.updateValidityNow();
		this.isUpdateInProgress = false;
		if (this.isUpdateQueued) {
			this.isUpdateQueued = false;
			this.update();
		}
	}

	private async updateValidityNow(): Promise<void> {
		const depositsWithUnknownValidity = await this.db.bankDeposits.getDeposits(
			{
				validity: "unknown",
			},
		);

		const newValidityPromises = depositsWithUnknownValidity.map(
			async (deposit) => {
				const nextDeposits = await this.db.bankDeposits.getDepositsAfter(
					deposit.id,
					this.lookahead,
				);
				if (nextDeposits.length >= this.lookahead) {
					const nextDepositsWithHistory = await Promise.all(
						nextDeposits.map(async (deposit) => ({
							bankDeposit: deposit,
							historyRecords: await this.db.bankDeposits.getDepositHistory(
								deposit,
							),
						})),
					);
					return isBankDepositValid(deposit, nextDepositsWithHistory);
				}
			},
		);

		const newValidity = await Promise.all(newValidityPromises);

		await Promise.all(
			depositsWithUnknownValidity.map(async (deposit, i) => {
				const isValid = newValidity[i];
				if (isValid != undefined) {
					await this.db.bankDeposits.setDepositValidity(
						deposit.id,
						isValid ? "valid" : "invalid",
					);
				}
			}),
		);
	}

	private async getHistoryForDeposits(
		deposits: ReadonlyArray<BankDeposit>,
	): Promise<BankDepositHistoryRecord[][]> {
		return await Promise.all(
			deposits.map((deposit) =>
				this.db.bankDeposits.getDepositHistory(deposit),
			),
		);
	}
}
