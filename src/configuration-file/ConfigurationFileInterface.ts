export interface ConfigurationFileInterface {
	token: string;
	databaseConnection: {
		client: string;
		host?: string;
		user?: string;
		password?: string;
		database?: string;
		filename?: string;
	};
}
