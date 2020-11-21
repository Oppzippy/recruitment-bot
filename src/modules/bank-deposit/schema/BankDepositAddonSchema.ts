import * as myzod from "myzod";

export const bankDepositAddonSchema = myzod.object({
	latestTransaction: myzod.object({
		player: myzod.object({
			name: myzod.string().min(1),
			realm: myzod.string().min(1),
		}),
		copper: myzod
			.number()
			.withPredicate(
				(copper) => copper > 0 && Number.isInteger(copper),
				"Copper must be a whole number greater than 0.",
			),
		timestamp: myzod.date(),
	}),
	previousTransactions: myzod
		.array(
			myzod.object({
				player: myzod.object({
					name: myzod.string().min(1),
					realm: myzod.string().min(1),
				}),
				copper: myzod
					.number()
					.withPredicate(
						(copper) => copper > 0 && Number.isInteger(copper),
						"Copper must be a whole number greater than 0.",
					),
			}),
		)
		.max(50),
	bankGuild: myzod.object({
		name: myzod.string().min(1),
		realm: myzod.string().min(1),
	}),
});
