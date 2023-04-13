import { Listener } from "@sapphire/framework";

export class ReadyListener extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			event: "ready",
			once: true,
		});
	}

	public async run(): Promise<void> {
		await this.container.client.recruitmentModule.refreshLeaderboards();
	}
}
