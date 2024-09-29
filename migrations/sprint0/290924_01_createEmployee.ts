import { Knex } from 'knex';

export const up = function(knex: Knex): Promise<void> {
    return knex.schema.createTable('Employees', (table) => {
        table.integer('Staff_ID').primary();  // Creates a primary key column
        table.string('Staff_FName');           // Creates a string column for the first name
        table.string('Staff_LName');           // Creates a string column for the last name
        table.string('Dept');                   // Creates a string column for department
        table.string('Position');               // Creates a string column for position
        table.string('Country');                // Creates a string column for country
        table.string('Email').unique();         // Creates a unique string column for email
        table.string('Reporting_Manager');      // Creates a string column for the reporting manager
        table.string('Role');                   // Creates a string column for the role
        table.timestamps(true, true);           // Creates created_at and updated_at timestamps

        table.unique(['Staff_ID', 'Role']);
    });
    
};

export const down = function(knex: Knex): Promise<void> {
    return knex.schema.dropTable('Employees'); // Reverts the changes by dropping the table
};
