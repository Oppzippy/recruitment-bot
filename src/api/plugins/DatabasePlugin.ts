import { FastifyInstance, FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";
import { DataStore } from "../../database/DataStore";

declare module "fastify" {
	interface FastifyInstance {
		db: DataStore;
	}
}

export const DatabasePlugin: FastifyPluginCallback = fp(
	async (fastify: FastifyInstance, db: DataStore): Promise<void> => {
		fastify.decorate("db", db);
	},
);
