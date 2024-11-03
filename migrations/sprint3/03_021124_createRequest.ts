import { Knex } from 'knex';

export const up = function (knex: Knex): Promise<void> {
    return knex.schema.createTable('Request', (table) => {
        table.increments('Request_ID').primary(); // Auto-increment primary key for Request_ID
        table.integer('Staff_ID').notNullable(); // Match type with Employees table
        table.foreign('Staff_ID').references('Staff_ID').inTable('Employees').onDelete('CASCADE'); // Proper foreign key to Employees table
        table.string('Current_Status'); // Current status of the request
        table.timestamp('Created_At').defaultTo(knex.fn.now()); // Creation timestamp
        table.timestamp('Last_Updated').defaultTo(knex.fn.now()); // Last updated timestamp
        table.string('Request_Reason').notNullable();
        table.string('Manager_Reason');
        table.boolean('User_Seen').defaultTo(false); // User_Seen column with default value false
        table.boolean('Manager_Seen').defaultTo(false); // Manager_Seen column with default value false
    });
};

export const down = function (knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('Request'); // Drop Request table when rolling back
};
