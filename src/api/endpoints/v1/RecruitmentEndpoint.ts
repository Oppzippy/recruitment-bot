import {
	FastifyInstance,
	FastifyPluginCallback,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";

export const RecruitmentEndpoint: FastifyPluginCallback = fp(
	async (fastify: FastifyInstance): Promise<void> => {
		fastify
			.route({
				method: "GET",
				url: "/v1/recruitment/user/:id/acceptedInvites",
				schema: {
					params: {
						type: "object",
						properties: {
							id: { type: "string" },
						},
						required: ["id"],
					},
				},
				handler: getAccepteeById,
			})
			.route({
				method: "GET",
				url: "/v1/recruitment/inviteLink/:id",
				schema: {
					params: {
						type: "object",
						properties: {
							id: { type: "string" },
						},
						required: ["id"],
					},
				},
				handler: getInviteLink,
			});
	},
);

async function getAccepteeById(
	this: FastifyInstance,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const acceptedInviteLinks = await this.db.inviteLinks.getUserAcceptedInviteLinks(
		request.guildId,
		request.params["id"],
	);
	reply.send(acceptedInviteLinks);
}

async function getInviteLink(
	this: FastifyInstance,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const inviteLink = await this.db.inviteLinks.getInviteLink(
		request.guildId,
		request.params["id"],
	);
	if (inviteLink) {
		reply.send(inviteLink);
	} else {
		reply.status(404).send({
			statusCode: 404,
			error: "Not Found",
			message: "The requested invite link does not exist.",
		});
	}
}
