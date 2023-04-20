import * as Sentry from "@sentry/node";
import { SpanStatus } from "@sentry/tracing";
import { addDays } from "date-fns";
import { InviteLinkFilter } from "../../modules/recruitment/leaderboard/InviteLinkFilter";
import { getCycleStartDate } from "../../util/Date";
import { KnexRepository } from "../KnexRepository";
import { RecruitmentScore } from "../models/RecruitmentScore";

export class RecruiterRepository extends KnexRepository {
	public async getRecruiterScores(
		guildId: string,
		filter?: InviteLinkFilter,
	): Promise<RecruitmentScore[]> {
		const transaction = Sentry.startTransaction({
			name: "RecruiterRepository.getRecruiterScores",
			data: { guildId, filter },
		});

		if (filter?.resetIntervalInDays && filter?.startDate) {
			filter = {
				...filter,
				startDate: getCycleStartDate(
					filter.startDate,
					filter.resetIntervalInDays,
					filter.now,
				),
			};
			filter.endDate = addDays(
				filter.startDate,
				filter.resetIntervalInDays,
			);
		}

		const scoreTransaction = transaction.startChild();
		const scoresWithDuplicates =
			await this.getRecruiterScoresWithDuplicates(guildId, filter);
		scoreTransaction.finish();
		const duplicateTransaction = transaction.startChild();
		const duplicatesByRecruiter = await this.getRecruiterDuplicates(
			guildId,
			filter,
		);
		duplicateTransaction.finish();

		const scores: RecruitmentScore[] = [];
		for (const [userId, score] of [...scoresWithDuplicates.entries()]) {
			const duplicates = duplicatesByRecruiter.get(userId);
			const count = score - (duplicates ?? 0);
			if (count > 0) {
				scores.push({
					guildId,
					count,
					recruiterDiscordId: userId,
				});
			}
		}
		transaction.setStatus(SpanStatus.Ok);
		transaction.finish();
		return scores;
	}

	public async getRecruiterScoresWithDuplicates(
		guildId: string,
		filter?: InviteLinkFilter,
	): Promise<Map<string, number>> {
		const numUsesSubquery = this.db({
			riluc: "recruitment_invite_link_usage_change",
		})
			.select("riluc.num_uses")
			.whereRaw("riluc.invite_link = ril.invite_link")
			.orderBy("riluc.created_at", "desc")
			.orderBy("riluc.id", "desc")
			.limit(1);

		if (filter?.endDate) {
			numUsesSubquery.andWhere("riluc.created_at", "<", filter.endDate);
		}

		const query = this.db({ ril: "recruitment_invite_link" })
			.select({
				ownerDiscordId: "ril.owner_discord_id",
				score: this.db.raw(`(SUM(?))`, numUsesSubquery),
			})
			.where("ril.guild_id", "=", guildId)
			.whereNull("ril.banned_at")
			.groupBy("ril.owner_discord_id");

		if (filter?.userId) {
			query.andWhere("ril.owner_discord_id", "=", filter.userId);
		}

		const queryPositiveScores = this.db
			.select("*")
			.from(query.as("asdf"))
			.where("score", ">", "0");
		const rows = await queryPositiveScores;

		const scores = rows.reduce(
			(map: Map<string, number>, score) =>
				map.set(score.ownerDiscordId, parseInt(score.score)),
			new Map<string, number>(),
		);

		if (filter?.startDate) {
			const scoresBeforeStart =
				await this.getRecruiterScoresWithDuplicates(guildId, {
					...filter,
					endDate: filter.startDate,
					startDate: undefined,
				});
			scores.forEach((score, userId) => {
				const scoreBeforeStart = scoresBeforeStart.get(userId) ?? 0;
				scores.set(userId, score - scoreBeforeStart);
			});
		}

		return scores;
	}

	public async getRecruiterDuplicates(
		guildId: string,
		filter?: InviteLinkFilter,
	): Promise<Map<string, number>> {
		const query = this.db({
			count_aril: "accepted_recruitment_invite_link",
		})
			.innerJoin(
				{ count_ril: "recruitment_invite_link" },
				"count_aril.invite_link",
				"=",
				"count_ril.invite_link",
			)
			.select({
				ownerDiscordId: "count_ril.owner_discord_id",
			})
			.count("*", { as: "duplicates" })
			.groupBy("count_ril.owner_discord_id")
			.where("count_ril.guild_id", "=", guildId)
			.andWhereRaw(
				// Only weight 0 and 1 are allowed. 0 is handled by counting it as a duplicate.
				// Not a clean solution, but due to the complexity of the queries in this file,
				// it is non-trivial to properly implement weighting. The main complication is
				// that we aren't counting accepted_recruitment_invite_link, we're only using it
				// for duplicate detection. The counting comes from recruitment_invite_link_usage_change.
				"((?) >= 1 OR count_aril.weight = 0)",
				this.db({
					exists_aril: "accepted_recruitment_invite_link",
				})
					.leftJoin(
						{ exists_ril: "recruitment_invite_link" },
						"exists_ril.invite_link",
						"=",
						"exists_aril.invite_link",
					)
					.count("*")
					.whereRaw("count_ril.guild_id = exists_aril.guild_id")
					.andWhereRaw(
						"count_aril.acceptee_discord_id = exists_aril.acceptee_discord_id",
					)
					.andWhereRaw(
						"exists_aril.created_at < count_aril.created_at",
					),
			);
		if (filter?.startDate) {
			query.andWhere("count_aril.created_at", ">=", filter.startDate);
		}
		if (filter?.endDate) {
			query.andWhere("count_aril.created_at", "<", filter.endDate);
		}
		const results = await query;
		const map = new Map<string, number>();
		for (const result of results) {
			map.set(
				result.ownerDiscordId,
				typeof result.duplicates == "string"
					? parseInt(result.duplicates)
					: 0,
			);
		}
		return map;
	}
}
