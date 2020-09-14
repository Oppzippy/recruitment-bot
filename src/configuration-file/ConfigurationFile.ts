import * as jsonfile from "jsonfile";
import { ConfigurationFileInterface } from "./ConfigurationFileInterface";

export class ConfigurationFile {
	public config: ConfigurationFileInterface;
	private path: string;

	public constructor(path: string) {
		this.path = path;
	}

	public async load(): Promise<ConfigurationFileInterface> {
		const config = await jsonfile.readFile(this.path);
		this.config = config;
		return this.config;
	}

	public async reload() {
		await this.load();
	}
}
