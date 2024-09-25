
import { Knex } from 'knex';

export const up = function(knex: Knex): Promise<void> {
    return knex.schema.createTable('RequestDetails', (table) => {
        table.integer('Request_ID').notNullable();  // Foreign key to Request
        table.date('WFH_StartDate').notNullable();
        table.date('WFH_EndDate').notNullable();
        table.string('Type_WFH').notNullable();
    });
};

export const down = function(knex: Knex): Promise<void> {
    return knex.schema.dropTable('RequestDetails');
};
