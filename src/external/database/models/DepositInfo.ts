export type DepositInfo = {
	latestDeposit: {
		player: {
			name: string;
			realm: string;
		};
		copper: number;
		timestamp: Date;
	};
	previousDeposits: {
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
