export type DepositInfo = {
	latestTransaction: {
		player: {
			name: string;
			realm: string;
		};
		copper: number;
		timestamp: Date;
	};
	previousTransactions: {
		player: {
			name: string;
			realm: string;
		};
		copper: number;
	}[];
	bankGuild: {
		name: string;
		realm: string;
	};
};
