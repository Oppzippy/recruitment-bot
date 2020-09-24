import { DiscordAPIError } from "discord.js";

export function isDiscordNotFoundError(err: Error): boolean {
	return err instanceof DiscordAPIError && err.httpStatus == 404;
}
