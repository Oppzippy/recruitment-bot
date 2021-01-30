import { DataStore } from "../../../external/DataStore";
import { Invite, InviteLinkTracker } from "./InviteLinkTracker";

describe("invite link tracker", () => {
	it("calculates differences with no previous links", async () => {
		const tracker = getInviteLinkTracker();
		const createInvite = createInviteFactory();
		const diff = await tracker.addState([
			createInvite(),
			createInvite({ uses: 2 }),
		]);
		expect(diff).toEqual(new Map([["invite2", 2]]));
	});

	it("calculates differences with previous invite links", async () => {
		const tracker = getInviteLinkTracker(
			new Map([
				["invite1", 1],
				["invite2", 2],
				["invite4", 3],
			]),
		);

		const createInvite = createInviteFactory();
		const diff = await tracker.addState([
			createInvite({ uses: 1 }),
			createInvite({ uses: 3 }),
			createInvite({ uses: 3 }),
			createInvite({ uses: 5 }),
		]);

		expect(diff).toEqual(
			new Map([
				["invite2", 1],
				["invite3", 3],
				["invite4", 2],
			]),
		);
	});

	it("calculates difference with some ineligible links", async () => {
		const tracker = getInviteLinkTracker();
		const createInvite = createInviteFactory();
		const diff = await tracker.addState([
			createInvite({ uses: 1, createdAt: new Date("2000-01-01") }),
			createInvite({ uses: 1 }),
		]);
		expect(diff).toEqual(new Map([["invite2", 1]]));
	});

	it("counts forced eligible links that would otherwise be ineligible", async () => {
		const tracker = getInviteLinkTracker(new Map([["invite1", 1]]));
		const createInvite = createInviteFactory();
		const diff = await tracker.addState([
			createInvite({ uses: 2, createdAt: new Date("2000-01-01") }),
			createInvite({ uses: 1 }),
		]);
		expect(diff).toEqual(
			new Map([
				["invite1", 1],
				["invite2", 1],
			]),
		);
	});

	it("persists forced eligible links", async () => {
		const tracker = getInviteLinkTracker(new Map([["invite2", 1]]));
		let createInvite = createInviteFactory();
		await tracker.addState([
			createInvite({ uses: 1 }),
			createInvite({ uses: 1, createdAt: new Date("2000-01-01") }),
		]);
		createInvite = createInviteFactory();
		await tracker.addState([
			createInvite({ uses: 2 }),
			createInvite({ uses: 1, createdAt: new Date("2000-01-01") }),
		]);
		createInvite = createInviteFactory();
		const diff = await tracker.addState([
			createInvite({ uses: 2 }),
			createInvite({ uses: 2, createdAt: new Date("2000-01-01") }),
		]);

		expect(diff).toEqual(new Map([["invite2", 1]]));
	});
});

function getInviteLinkTracker(
	prevInvites = new Map<string, number>(),
): InviteLinkTracker {
	const mockDS = {
		inviteLinks: {
			getInviteLinkUsage: jest.fn(async () => prevInvites),
			setInviteLinkUsage: jest.fn(),
			addInviteLinks: jest.fn(),
		},
	};
	return new InviteLinkTracker((mockDS as unknown) as DataStore, "test");
}

function createInviteFactory() {
	let id = 1;
	return (overrides: Partial<Invite> = {}): Invite => {
		return {
			code: `invite${id++}`,
			createdAt: new Date(),
			inviter: {
				id: "testInviter",
			},
			uses: 0,
			...overrides,
		};
	};
}
