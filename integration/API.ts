import { HuokanAPI } from "../src/HuokanAPI";
import { useDataStore, doneWithDataStore } from "./DataStore";

let api: HuokanAPI;
let userCount = 0;
let port = 3000;

export async function useAPI(): Promise<string> {
	const url = `http://localhost:${port}`;
	if (!api) {
		api = new HuokanAPI(useDataStore());
		await api.listen(port);
		userCount = 0;
		port++;
	}
	userCount++;
	return url;
}

export async function doneWithAPI(): Promise<void> {
	userCount--;
	if (userCount <= 0 && api) {
		await api.destroy();
		api = undefined;
		doneWithDataStore();
	}
}

export const apiURL = "http://localhost:3030";
