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
				url: "/v1/recruitment/user/:id/recruiter",
				schema: {
					params: {
						type: "object",
						properties: {
							id: { type: "string" },
						},
						required: ["id"],
					},
				},
				handler: getAccepteeRecruiter,
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

async function getAccepteeRecruiter(
	this: FastifyInstance,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const acceptedInvites = await this.db.inviteLinks.getUserAcceptedInviteLinks(
		request.guildId,
		request.params["id"],
	);
	if (acceptedInvites.length >= 1) {
		const [firstAcceptedInvite] = acceptedInvites;
		const ownerId = await this.db.inviteLinks.getOwnerId(
			firstAcceptedInvite.inviteLink,
		);
		reply.send({
			inviteLink: firstAcceptedInvite.inviteLink,
			inviterDiscordId: ownerId,
			timestamp: firstAcceptedInvite.timestamp,
		});
	} else {
		reply.code(404);
		reply.send({
			statusCode: 404,
			error: "Not Found",
			message: "The requested user has not been invited to the server.",
		});
	}
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
