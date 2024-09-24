import { Knex } from 'knex';

export const up = function(knex: Knex): Promise<void> {
    return knex.schema.createTable('WFHRequests', (table) => {
        table.integer('Staff_ID').primary();
        table.string('Dept');
        table.date('WFH_StartDate');
        table.date('WFH_EndDate');
        table.string('Type_WFH');
        table.string('Request_Status');
        table.date('Request_Date');
        table.date('Modification_Date');
        table.integer('Superviser_ID');
        table.date('Decision_Date');
        table.string('Rejection_Reason');
        table.string('Modification_Reason');
        table.timestamps(true, true);

        
    });
};

export const down = function(knex: Knex): Promise<void> {
    return knex.schema.dropTable('WFHRequests');
};
