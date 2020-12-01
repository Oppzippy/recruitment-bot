import {
	FastifyRequest,
	FastifyReply,
	FastifyInstance,
	FastifyPluginCallback,
} from "fastify";
import fp from "fastify-plugin";
import {
	DepositInfo,
	parseCompressedDepositInfo,
} from "../../../modules/bank-deposit/schema/DepositInfo";

type GetBankDepositHandlerParams = {
	guildId: string;
	id: string;
};

export const BankDepositEndpoint: FastifyPluginCallback = fp(
	async (fastify: FastifyInstance): Promise<void> => {
		fastify
			.route({
				method: "GET",
				url: "/v1/bank/deposit/:id",
				schema: {
					params: {
						type: "object",
						properties: {
							id: { type: "string" },
						},
						required: ["id"],
					},
				},
				handler: getBankDepositByIdHandler,
			})
			.route({
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
			})
			.route({
				method: "POST",
				url: "/v1/bank/deposit",
				schema: {
					body: {
						type: "object",
						properties: {
							depositString: { type: "string" },
						},
						required: ["depositString"],
					},
				},
				handler: postBankDepositHandler,
			});
	},
);

async function getBankDepositByIdHandler(
	this: FastifyInstance,
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	const id = request.params["id"];
	const deposit = await this.db.bankDeposits.getDepositById(id);
	if (deposit) {
		reply.send(deposit);
	} else {
		reply.status(404).send({
			statusCode: 404,
			error: "Not Found",
			message: "The requested bank deposit does not exist.",
		});
	}
}

async function getBankDepositHandler(
	this: FastifyInstance,
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	const query = request.query as GetBankDepositHandlerParams;
	const deposits = await this.db.bankDeposits.getDeposits({
		discordGuildId: request.guildId,
		id: query.id,
	});
	reply.send({
		bankDeposits: [...deposits],
	});
}

async function postBankDepositHandler(
	this: FastifyInstance,
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	// TODO support sending deposit info directly rather than a compressed string
	if (typeof request.body["depositString"] == "string") {
		let depositInfo: DepositInfo;
		try {
			depositInfo = await parseCompressedDepositInfo(
				request.body["depositString"],
			);
		} catch (err) {
			reply.status(400).send({
				statusCode: 400,
				error: "Bad Request",
				message: "Failed to parse deposit string.",
			});
			return;
		}
		const id = await this.db.bankDeposits.addDeposit(
			request.guildId,
			depositInfo.bankGuild,
			depositInfo.latestDeposit,
			depositInfo.previousDeposits,
		);
		const deposit = await this.db.bankDeposits.getDepositById(id);
		reply.status(201).send(deposit);
	}
}
