import jsonfile from "jsonfile";
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

	public loadSync(): ConfigurationFileInterface {
		const config = jsonfile.readFileSync(this.path);
		this.config = config;
		return config;
	}

	public async reload(): Promise<ConfigurationFileInterface> {
		return await this.load();
	}

	public reloadSync(): ConfigurationFileInterface {
		return this.loadSync();
	}
}
