import { DiscordAPIError } from "discord.js";

export function isDiscordNotFoundError(err: Error): boolean {
	return err instanceof DiscordAPIError && err.status == 404;
}

export function snowflakeDate(snowflake: bigint): Date {
	// https://discord.com/developers/docs/reference#snowflakes
	const timestamp = (snowflake >> 22n) + 1420070400000n; // Discord epoch
	return new Date(Number(timestamp));
}
