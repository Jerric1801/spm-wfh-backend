import { Knex } from 'knex';

export const up = function(knex: Knex): Promise<void> {
  return knex.schema.createTable('BlackoutDetails', (table) => {
    table.integer('Blackout_ID').notNullable();
    table.date('Date').notNullable(); 
    table.string('Timeblock').notNullable(); 

    table.primary(['Blackout_ID', 'Date']);

    table.foreign('Blackout_ID')
      .references('Blackout_ID')
      .inTable('BlackoutPeriod')
      .onDelete('CASCADE');
  });
};

export const down = function(knex: Knex): Promise<void> {
  return knex.schema.dropTable('BlackoutDetails'); 
};