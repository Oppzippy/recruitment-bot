import fastify, { FastifyInstance } from "fastify";
import { BankDepositEndpoint } from "./api/endpoints/v1/BankDepositEndpoint";
import { ApiKeyPlugin } from "./api/plugins/ApiKeyPlugin";
import { DatabasePlugin } from "./api/plugins/DatabasePlugin";
import { DataStore } from "./external/DataStore";

export class HuokanAPI {
	private server: FastifyInstance;
	public constructor(db: DataStore) {
		this.server = fastify({});
		this.server.setErrorHandler((error, request, reply) => {
			if (error.validation) {
				reply.status(400).send({
					statusCode: 400,
					error: "Bad Request",
					message: error.message,
				});
			} else {
				reply
					.status(500)
					.send({ statusCode: 500, error: "Internal Server Error" });
				console.error(error);
			}
		});

		this.server.register(DatabasePlugin, db);
		this.server.register(ApiKeyPlugin);
		this.server.register(BankDepositEndpoint);
	}

	public async listen(port = 3000): Promise<void> {
		await this.server.listen(port);
	}

	public async destroy(): Promise<void> {
		await this.server.close();
	}
}
