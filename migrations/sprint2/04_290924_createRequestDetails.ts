import { Knex } from 'knex';

export const up = function (knex: Knex): Promise<void> {
  return knex.schema.createTable('RequestDetails', (table) => {
    table.integer('Request_ID').notNullable(); // Matches the type of Request_ID in Request table
    table.foreign('Request_ID').references('Request_ID').inTable('Request').onDelete('CASCADE'); // Foreign key to Request table
    table.date('Date').notNullable(); // Date for WFH request
    table.string('WFH_Type').notNullable(); // Type of WFH (e.g., partial, full day)
    table.primary(['Request_ID', 'Date']); // Composite primary key (Request_ID and Date)
  });
};

export const down = function (knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('RequestDetails'); // Drop RequestDetails table when rolling back
};
