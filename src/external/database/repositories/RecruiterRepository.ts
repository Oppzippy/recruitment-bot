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

		const [scoresWithDuplicates, duplicates] = await Promise.all([
			this.getRecruiterScoresWithDuplicates(guildId, filter),
			this.getRecruiterDuplicates(guildId, filter),
		]);
		const scores: RecruitmentScore[] = [];
		scoresWithDuplicates.forEach((score, userId) => {
			const count = score - (duplicates.get(userId) ?? 0);
			if (count > 0) {
				scores.push({
					guildId,
					count,
					recruiterDiscordId: userId,
				});
			}
		});
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
			const scoresBeforeStart = await this.getRecruiterScoresWithDuplicates(
				guildId,
				{
					...filter,
					endDate: filter.startDate,
					startDate: undefined,
				},
			);
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
		filter?: InviteLinkFilter,
	): Promise<Map<string, number>> {
		const duplicateCountSubquery = this.db({
			rildc: "recruitment_invite_link_duplicate_change",
		})
			.select("rildc.duplicates")
			.whereRaw("rildc.invite_link = rildc2.invite_link")
			.andWhereRaw(
				"rildc.acceptee_discord_id = rildc2.acceptee_discord_id",
			)
			.orderBy("rildc.created_at", "desc")
			.orderBy("rildc.id", "desc")
			.limit(1);

		const duplicatesSubquery = this.db({
			rildc2: "recruitment_invite_link_duplicate_change",
		})
			.select({
				duplicates: duplicateCountSubquery,
			})
			.whereRaw("ril.invite_Link = rildc2.invite_link")
			.groupBy("rildc2.acceptee_discord_id");

		if (filter?.endDate) {
			duplicateCountSubquery.where(
				"rildc.created_at",
				"<",
				filter.endDate.toISOString(),
			);
		}

		const query = this.db({ ril: "recruitment_invite_link" })
			.select({
				ownerDiscordId: "ril.owner_discord_id",
				duplicates: this.db.raw(
					`CAST(
						SUM(
							(SELECT SUM(rildc3.duplicates) from (${duplicatesSubquery.toString()}) as rildc3)
						) AS SIGNED
					)`,
				),
			})
			.where("ril.guild_id", "=", guildId)
			.groupBy("ril.owner_discord_id");

		if (filter?.userId) {
			query.where("ril.owner_discord_id", "=", filter.userId);
		}
		const rows = await query;
		const scores = rows.reduce(
			(map: Map<string, number>, score) =>
				map.set(score.ownerDiscordId, score.duplicates),
			new Map<string, number>(),
		);

		if (filter?.startDate) {
			const scoresBeforeStart = await this.getRecruiterDuplicates(
				guildId,
				{
					...filter,
					endDate: filter.startDate,
					startDate: undefined,
				},
			);
			scores.forEach((score, userId) => {
				scores.set(
					userId,
					score - (scoresBeforeStart.get(userId) ?? 0),
				);
			});
		}
		return scores;
	}
}
