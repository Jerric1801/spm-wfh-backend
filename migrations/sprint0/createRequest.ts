
import { Knex } from 'knex';

export const up = function(knex: Knex): Promise<void> {
    return knex.schema.createTable('Request', (table) => {
        table.integer('Request_ID').primary();  // Primary key
        table.integer('Staff_ID').notNullable();  // Foreign key to Staff
        table.string('Dept').notNullable();  // Department of staff
        table.string('Current_Status').notNullable();  // Current request status
        table.date('Created_At').notNullable();  // Request creation date
        table.date('Updated_At').notNullable();  // Request update/modification date
        table.integer('Superviser_ID').notNullable();  // Foreign key to Supervisor
    });
};

export const down = function(knex: Knex): Promise<void> {
    return knex.schema.dropTable('Request');
};
