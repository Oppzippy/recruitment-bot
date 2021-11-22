import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
	await seedInviteLinks(knex);
	await seedAcceptedInviteLinks(knex);
}

async function seedInviteLinks(knex: Knex): Promise<void> {
	await knex("recruitment_invite_link").insert([
		{
			guild_id: "guild1",
			invite_link: "invite1",
			owner_discord_id: "owner1",
		},
		{
			guild_id: "guild1",
			invite_link: "invite2",
			owner_discord_id: "owner1",
		},
		{
			guild_id: "guild1",
			invite_link: "invite3",
			owner_discord_id: "owner2",
		},
		{
			guild_id: "guild2",
			invite_link: "invite4",
			owner_discord_id: "owner3",
		},
		{
			guild_id: "guild3",
			invite_link: "invite5",
			owner_discord_id: "owner4",
		},
		{
			guild_id: "guild4",
			invite_link: "invite6",
			owner_discord_id: "owner5",
		},
		{
			guild_id: "guild4",
			invite_link: "invite7",
			owner_discord_id: "owner5",
			banned_at: "2020-02-10 00:00:00",
		},
	]);
}

async function seedAcceptedInviteLinks(knex: Knex): Promise<void> {
	for (let i = 1; i <= 4; i++) {
		await addAcceptee(knex, {
			acceptee: "acceptee1",
			createdAt: `2020-02-01 0${i}:00:00`,
			inviteLink: "invite1",
			guildId: "guild1",
			uses: i,
		});
	}

	await addAcceptee(knex, {
		acceptee: "acceptee1",
		createdAt: `2020-02-03 00:00:00`,
		inviteLink: "invite1",
		guildId: "guild1",
		uses: 5,
	});

	await addAcceptee(knex, {
		acceptee: "acceptee2",
		createdAt: `2020-02-03 00:00:00`,
		inviteLink: "invite1",
		guildId: "guild1",
		uses: 6,
	});

	await addAcceptee(knex, {
		acceptee: "acceptee2",
		createdAt: `2020-02-03 00:00:01`,
		inviteLink: "invite1",
		guildId: "guild1",
		uses: 7,
	});

	await addAcceptee(knex, {
		acceptee: "acceptee2",
		createdAt: `2020-02-03 01:00:00`,
		inviteLink: "invite2",
		guildId: "guild1",
		uses: 1,
	});

	await addAcceptee(knex, {
		acceptee: "acceptee3",
		createdAt: `2020-02-05 00:00:00`,
		inviteLink: "invite2",
		guildId: "guild1",
		uses: 2,
	});

	await addAcceptee(knex, {
		acceptee: "acceptee4",
		createdAt: `2020-02-05 00:00:00`,
		inviteLink: "invite3",
		guildId: "guild1",
		uses: 1,
	});

	await addAcceptee(knex, {
		acceptee: "acceptee5",
		createdAt: `2020-02-05 00:00:00`,
		inviteLink: "invite3",
		guildId: "guild1",
		uses: 2,
	});

	await addAcceptee(knex, {
		guildId: "guild3",
		acceptee: "acceptee6",
		createdAt: "2020-02-07 00:00:00",
	});

	await addAcceptee(knex, {
		inviteLink: "invite5",
		acceptee: "acceptee6",
		guildId: "guild3",
		createdAt: "2020-02-07 00:00:01", // TODO revert this to 00:00:00 to test duplicate invites that occur at the same time
		uses: 1,
	});

	await addAcceptee(knex, {
		inviteLink: "invite5",
		acceptee: "acceptee7",
		guildId: "guild3",
		createdAt: "2020-02-07 01:00:00",
		uses: 2,
	});

	await addAcceptee(knex, {
		inviteLink: "invite6",
		acceptee: "acceptee8",
		guildId: "guild4",
		createdAt: "2020-02-08 00:00:00",
		uses: 1,
	});
	await addAcceptee(knex, {
		inviteLink: "invite7",
		acceptee: "acceptee9",
		guildId: "guild4",
		createdAt: "2020-02-08 00:00:01",
		uses: 1,
	});
}

async function addAcceptee(
	knex: Knex,
	acceptee: {
		inviteLink?: string;
		uses?: number;
		acceptee: string;
		createdAt: string;
		guildId: string;
	},
) {
	if (!acceptee.inviteLink) {
		await knex("accepted_recruitment_invite_link").insert({
			guild_id: acceptee.guildId,
			acceptee_discord_id: acceptee.acceptee,
			created_at: acceptee.createdAt,
			updated_at: acceptee.createdAt,
		});
	} else {
		await knex("accepted_recruitment_invite_link").insert({
			guild_id: acceptee.guildId,
			invite_link: acceptee.inviteLink,
			acceptee_discord_id: acceptee.acceptee,
			created_at: acceptee.createdAt,
			updated_at: acceptee.createdAt,
		});
		await knex("recruitment_invite_link_usage_change").insert({
			invite_link: acceptee.inviteLink,
			num_uses: acceptee.uses,
			created_at: acceptee.createdAt,
			updated_at: acceptee.createdAt,
		});
	}
}
