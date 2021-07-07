import * as Sentry from "@sentry/node";
import { addDays } from "date-fns";
import { InviteLinkFilter } from "../../../modules/recruitment/leaderboard/InviteLinkFilter";
import { getCycleStartDate } from "../../../util/Date";
import { KnexRepository } from "../KnexRepository";
import { RecruitmentScore } from "../models/RecruitmentScore";

export class RecruiterRepository extends KnexRepository {
	public async getRecruiterScores(
		guildId: string,
		filter?: InviteLinkFilter,
	): Promise<RecruitmentScore[]> {
		const transaction = Sentry.startTransaction({
			name: "RecruiterRepository.getRecruiterScores",
			data: { filter },
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

		const scoresWithDuplicates =
			await this.getRecruiterScoresWithDuplicates(guildId, filter);
		const scores: RecruitmentScore[] = [];
		const promises = [...scoresWithDuplicates.entries()].map(
			async ([userId, score]) => {
				const duplicates = await this.getRecruiterDuplicates(
					guildId,
					userId,
					filter,
				);
				const count = score - (duplicates ?? 0);
				if (count > 0) {
					scores.push({
						guildId,
						count,
						recruiterDiscordId: userId,
					});
				}
			},
		);
		await Promise.all(promises);
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
			numUsesSubquery.andWhere(
				"riluc.created_at",
				"<",
				filter.endDate.toISOString(),
			);
		}

		const query = this.db({ ril: "recruitment_invite_link" })
			.select({
				ownerDiscordId: "ril.owner_discord_id",
				score: this.db.raw(
					`CAST(SUM((${numUsesSubquery.toString()})) AS SIGNED)`,
				),
			})
			.where("ril.guild_id", "=", guildId)
			.groupBy("ril.owner_discord_id");

		if (filter?.userId) {
			query.andWhere("ril.owner_discord_id", "=", filter.userId);
		}
		const rows = await query;
		const scores = rows.reduce(
			(map: Map<string, number>, score) =>
				map.set(score.ownerDiscordId, score.score),
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
				scores.set(
					userId,
					score - (scoresBeforeStart.get(userId) ?? 0),
				);
			});
		}

		return scores;
	}

	public async getRecruiterDuplicates(
		guildId: string,
		recruiterId: string,
		filter?: InviteLinkFilter,
	): Promise<number> {
		const query = this.db({
			count_aril: "accepted_recruitment_invite_link",
		})
			.innerJoin(
				{ count_ril: "recruitment_invite_link" },
				"count_aril.invite_link",
				"=",
				"count_ril.invite_link",
			)
			.count("*", { as: "duplicates" })
			.where("count_ril.guild_id", "=", guildId)
			.andWhere("count_ril.owner_discord_id", "=", recruiterId)
			.andWhereRaw(
				`(${this.db({
					exists_aril: "accepted_recruitment_invite_link",
				})
					.leftJoin(
						{ exists_ril: "recruitment_invite_link" },
						"exists_ril.invite_link",
						"=",
						"exists_aril.invite_link",
					)
					.count("*")
					.whereRaw(
						"(count_ril.guild_id = exists_ril.guild_id OR count_ril.guild_id = exists_aril.guild_id)",
					)
					.andWhereRaw(
						"count_aril.acceptee_discord_id = exists_aril.acceptee_discord_id",
					)
					.andWhereRaw(
						"exists_aril.created_at < count_aril.created_at",
					)
					.toString()}) >= 1`,
			);
		if (filter?.startDate) {
			query.andWhere(
				"count_aril.created_at",
				">=",
				filter.startDate.toISOString(),
			);
		}
		if (filter?.endDate) {
			query.andWhere(
				"count_aril.created_at",
				"<",
				filter.endDate.toISOString(),
			);
		}
		const results = await query.first();
		if (typeof results.duplicates != "number") {
			throw new Error(
				"expected number, got " + typeof results.duplicates,
			);
		}
		return results.duplicates;
	}
}
