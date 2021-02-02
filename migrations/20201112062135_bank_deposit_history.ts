import Knex from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("bank_deposit_history", (table) => {
		table.increments().primary();
		table
			.integer("bank_deposit_id")
			.notNullable()
			.unsigned()
			.references("id")
			.inTable("bank_deposit");
		table.string("player_name").notNullable();
		table.string("player_realm").notNullable();
		table.integer("copper").notNullable();
		table
			.integer("order")
			.notNullable()
			.unsigned()
			.comment("deposits get older as order increases");

		table.unique(["bank_deposit_id", "order"]);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable("bank_deposit_history");
}
