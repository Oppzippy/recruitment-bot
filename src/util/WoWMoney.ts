const COPPER_PER_SILVER = 100;
const COPPER_PER_GOLD = 10000;

const numberFormat = new Intl.NumberFormat();

export class WoWMoney {
	public readonly totalCopper: number;

	public constructor(totalCopper = 0) {
		this.totalCopper = totalCopper;
	}

	public getGold(): number {
		return Math.floor(this.getAbsTotalCopper() / COPPER_PER_GOLD);
	}

	public getSilver(): number {
		return (
			Math.floor(this.getAbsTotalCopper() / COPPER_PER_SILVER) %
			(COPPER_PER_GOLD / COPPER_PER_SILVER)
		);
	}

	public getCopper(): number {
		return this.getAbsTotalCopper() % COPPER_PER_SILVER;
	}

	private getAbsTotalCopper(): number {
		return Math.abs(this.totalCopper);
	}

	private isNegative(): boolean {
		return this.totalCopper < 0;
	}

	public toString(): string {
		const goldString = numberFormat.format(this.getGold());
		const silverString = numberFormat.format(this.getSilver());
		const copperString = numberFormat.format(this.getCopper());
		const moneyString = `${goldString}g ${silverString}s ${copperString}c`;
		return `${this.isNegative() ? "-" : ""}${moneyString}`;
	}

	public toMinimalString(): string {
		const gold = this.getGold();
		const silver = this.getSilver();
		const copper = this.getCopper();
		const parts = [];
		if (gold > 0) {
			parts.push(`${numberFormat.format(gold)}g`);
		}
		if (silver > 0) {
			parts.push(`${numberFormat.format(silver)}s`);
		}
		if (copper > 0) {
			parts.push(`${numberFormat.format(copper)}c`);
		}
		const moneyString = parts.length >= 1 ? parts.join(" ") : "0c";
		return `${this.isNegative() ? "-" : ""}${moneyString}`;
	}
}
