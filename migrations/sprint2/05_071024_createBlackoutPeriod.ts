import { Knex } from 'knex';

export const up = function(knex: Knex): Promise<void> {
    return knex.schema.createTable('BlackoutPeriod', (table) => {
        table.integer('Blackout_ID').primary(); 
        table.string('Dept');     
        table.string('Reason');        
        table.timestamps(true, true);         
    });
    
};

export const down = function(knex: Knex): Promise<void> {
    return knex.schema.dropTable('BlackoutPeriod'); 
};
