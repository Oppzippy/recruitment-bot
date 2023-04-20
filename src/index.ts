import * as Sentry from "@sentry/node";
import { GuildChannel } from "discord.js";
import dotenv from "dotenv";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { knex, Knex } from "knex";
import knexStringcase from "knex-stringcase";
import { pick } from "lodash";
import process from "process";
import readline from "readline";
import "source-map-support/register";
import { getHeapSnapshot } from "v8";
import { KnexDataStore } from "./database/KnexDataStore";
import { HuokanAPI } from "./HuokanAPI";
import { HuokanClient } from "./HuokanClient";

dotenv.config();

if (process.env.SENTRY_DSN) {
	Sentry.init({
		environment: process.env.NODE_ENV ?? "development",
		dsn: process.env.SENTRY_DSN,
		tracesSampleRate: 0.4,
	});
}

const knexConfig: Knex.Config = {
	client: process.env.DB_CLIENT,
	connection: {
		timezone: "+00:00",
		host: process.env.DB_HOST,
		database: process.env.DB_DATABASE,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		port: parseInt(process.env.DB_PORT),
		bigNumberStrings: true,
		supportBigNumbers: true,
	},
};

const knexInstance = knex(knexStringcase(knexConfig));
const db = new KnexDataStore(knexInstance);

const client = new HuokanClient(db);
client.login(process.env.DISCORD_TOKEN);

const api = new HuokanAPI(db);
api.listen();

console.info("Started bot.");

async function destroy() {
	api.destroy();
	client.destroy();
	await knexInstance.destroy();
}

process.on("SIGINT", destroy);
process.on("SIGTERM", destroy);

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

rl.on("line", async (line) => {
	const args = line.split(" ");
	switch (args[0]) {
		case "stop":
		case "exit":
			console.info("Stopping bot...");
			await destroy();
			process.exit(0);
			break;
		case "channel-permission":
			if (args.length == 2) {
				const channel = await client.channels.fetch(args[1]);
				if (channel instanceof GuildChannel) {
					const permissions = channel.permissionsFor(client.user);
					console.log(permissions.toArray());
				}
			}
			break;
		case "invite-info":
			if (args.length >= 2) {
				const guild = await client.guilds.fetch(args[1]);
				const inviteCollection = await guild.invites.fetch();
				const invites = [...inviteCollection.values()];

				const allowedProps = [
					"code",
					"createdAt",
					"createdTimestamp",
					"expiresAt",
					"maxAge",
					"maxUses",
					"memberCount",
					"presenceCount",
					"temporary",
					"url",
					"uses",
				];
				const invitesInfo = invites
					.filter(
						(invite) => args.length == 2 || args[2] == invite.code,
					)
					.map((invite) => ({
						...pick(invite, allowedProps),
						inviter: invite.inviter.id,
						inviterTag: invite.inviter.tag,
					}));
				console.log(invitesInfo);
			}
			break;
		case "heapsnapshot": {
			try {
				try {
					await mkdir("heapsnapshots");
				} catch (err) {
					if (err.code != "EEXIST") {
						throw err;
					}
				}
				const snapshot = getHeapSnapshot();
				const stream = createWriteStream(
					`heapsnapshots/${Date.now()}.heapsnapshot`,
				);
				snapshot
					.pipe(stream)
					.on("close", () => console.log("dump complete"));
			} catch (err) {
				console.error(err);
			}
			break;
		}
	}
});
