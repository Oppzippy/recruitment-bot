import * as jsonfile from "jsonfile";
import ConfigurationFileInterface from "./ConfigurationFileInterface";

class ConfigurationFile {
	public config: ConfigurationFileInterface;
	private path: string;

	constructor(path: string) {
		this.path = path;
	}

	async load(): Promise<ConfigurationFileInterface> {
		const config = await jsonfile.readFile(this.path);
		this.config = config;
		return this.config;
	}

	async reload() {
		await this.load();
	}
}

export default ConfigurationFile;
