import {
	FastifyInstance,
	FastifyPluginCallback,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
	interface FastifyRequest {
		guildId?: string;
	}
}

export const ApiKeyPlugin: FastifyPluginCallback = fp(
	async (fastify: FastifyInstance): Promise<void> => {
		fastify.addHook("onRequest", onRequest.bind(fastify));
	},
);

async function onRequest(
	this: FastifyInstance,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	if (request.headers.authorization) {
		const authorization = request.headers.authorization.match(
			/^bearer (.*)$/i,
		);
		const key = authorization && authorization[1];
		if (!key || !(await this.db.apiKeys.doesApiKeyExist(key))) {
			reply.code(401).send({
				statusCode: 401,
				error: "Unauthorized",
				message: "Invalid api key.",
			});
			return;
		}
		let guildId = request.query["guildId"] ?? request.params["guildId"];
		if (typeof guildId != "string") {
			const guilds = await this.db.apiKeys.getGuildPermissions(key);
			if (guilds.length != 1) {
				reply.code(400).send({
					statusCode: 400,
					error: "Bad Request",
					message: "Please specify a guildId.",
				});
				return;
			}
			guildId = guilds[0];
		}
		const hasPermission = await this.db.apiKeys.doesApiKeyHavePermission(
			key,
			guildId,
		);
		if (!hasPermission) {
			reply.code(401).send({
				statusCode: 401,
				error: "Unauthorized",
				message:
					"The supplied api key does not have permission to access this guild.",
			});
			return;
		}
		request.guildId = guildId;
		return;
	}
	reply.code(401).send({
		statusCode: 401,
		error: "Unauthorized",
		message:
			'Please supply a key with the "Authorization: Bearer your_api_key" header.',
	});
}
