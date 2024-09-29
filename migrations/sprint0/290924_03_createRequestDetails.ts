import { Knex } from 'knex';

export const up = function (knex: Knex): Promise<void> {
  return knex.schema.createTable('RequestDetails', (table) => {
    table.integer('Request_ID').references('Request_ID').inTable('Request'); // Foreign key to Request table
    table.date('Date'); // Date for WFH request
    table.string('WFH_Type'); // Type of WFH (e.g., partial, full day)
    table.primary(['Request_ID', 'Date']); // Composite primary key
  });
};

export const down = function (knex: Knex): Promise<void> {
  return knex.schema.dropTable('RequestDetails');
};