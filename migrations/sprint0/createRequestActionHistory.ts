
import { Knex } from 'knex';

export const up = function(knex: Knex): Promise<void> {
    return knex.schema.createTable('RequestActionHistory', (table) => {
        table.integer('Request_ID').notNullable();  // Foreign key to Request
        table.string('Status').notNullable();
        table.string('Reason').notNullable();
        table.date('Updated_At').notNullable();
        table.integer('Updated_By').notNullable();  // Foreign key to Supervisor
    });
};

export const down = function(knex: Knex): Promise<void> {
    return knex.schema.dropTable('RequestActionHistory');
};
