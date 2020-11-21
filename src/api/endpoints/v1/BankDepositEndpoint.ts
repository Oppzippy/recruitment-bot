import {
	FastifyRequest,
	FastifyReply,
	FastifyInstance,
	FastifyPluginCallback,
} from "fastify";
import fp from "fastify-plugin";

type BankDepositHandlerParams = {
	guildId: string;
	id: string;
};

export const BankDepositEndpoint: FastifyPluginCallback = fp(
	async (fastify: FastifyInstance): Promise<void> => {
		fastify.route({
			method: "GET",
			url: "/v1/bank/deposit",
			schema: {
				querystring: {
					type: "object",
					properties: {
						id: { type: "string" },
					},
					required: ["id"],
				},
			},
			handler: getBankDepositHandler,
		});
	},
);

async function getBankDepositHandler(
	this: FastifyInstance,
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	const query = request.query as BankDepositHandlerParams;
	const deposits = await this.db.bankDeposits.getDeposits({
		discordGuildId: request.guildId,
		id: query.id,
	});
	reply.send({
		bankDeposits: [...deposits],
	});
}
