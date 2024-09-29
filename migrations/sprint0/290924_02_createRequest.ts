import { Knex } from 'knex';

export const up = function (knex: Knex): Promise<void> {
  return knex.schema.createTable('Request', (table) => {
    table.integer('Request_ID').primary();
    table.integer('Staff_ID').references('Staff_ID').inTable('Employees'); // Foreign key to Employees table
    table.string('Current_Status'); // Current status of the request
    table.timestamp('Created_At').defaultTo(knex.fn.now()); // Creation timestamp
    table.timestamp('Last_Updated').defaultTo(knex.fn.now()); // Last updated timestamp
  });
};

export const down = function (knex: Knex): Promise<void> {
  return knex.schema.dropTable('Request');
};