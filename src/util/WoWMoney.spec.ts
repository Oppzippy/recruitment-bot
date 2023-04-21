import { WoWMoney } from "./WoWMoney";
import { expect } from "chai";

describe("coin extraction", () => {
	it("extracts copper", () => {
		const money = new WoWMoney(12_49_53);
		expect(money.getCopper()).to.equal(53);
	});
	it("extracts silver", () => {
		const money = new WoWMoney(52_35_94);
		expect(money.getSilver()).to.equal(35);
	});
	it("extracts gold", () => {
		const money = new WoWMoney(358_29_35);
		expect(money.getGold()).to.equal(358);
	});
});

describe("wow money formatting", () => {
	it("formats 0", () => {
		const money = new WoWMoney();
		expect(money.toString()).to.equal("0g 0s 0c");
	});
	it("formats 1 silver", () => {
		const money = new WoWMoney(1_00);
		expect(money.toString()).to.equal("0g 1s 0c");
	});
	it("formats 1 gold", () => {
		const money = new WoWMoney(1_00_00);
		expect(money.toString()).to.equal("1g 0s 0c");
	});
	it("formats large numbers of gold", () => {
		const money = new WoWMoney(42873_00_00);
		expect(money.toString()).to.equal("42,873g 0s 0c");
	});
	it("formats negatives", () => {
		const money = new WoWMoney(-42873_23_40);
		expect(money.toString()).to.equal("-42,873g 23s 40c");
	});
});

describe("wow money minimal formatting", () => {
	it("formats 0", () => {
		const money = new WoWMoney(0);
		expect(money.toMinimalString()).to.equal("0c");
	});
	it("formats 1 copper", () => {
		const money = new WoWMoney(1);
		expect(money.toMinimalString()).to.equal("1c");
	});
	it("formats 1 silver", () => {
		const money = new WoWMoney(1_00);
		expect(money.toMinimalString()).to.equal("1s");
	});
	it("formats 1 gold", () => {
		const money = new WoWMoney(1_00_00);
		expect(money.toMinimalString()).to.equal("1g");
	});
	it("formats mixed coins", () => {
		const money = new WoWMoney(493_62_03);
		expect(money.toMinimalString()).to.equal("493g 62s 3c");
	});
	it("formats large numbers of gold", () => {
		const money = new WoWMoney(123456_00_00);
		expect(money.toMinimalString()).to.equal("123,456g");
	});
	it("formats negatives", () => {
		const money = new WoWMoney(-12_34_56);
		expect(money.toMinimalString()).to.equal("-12g 34s 56c");
	});
});
