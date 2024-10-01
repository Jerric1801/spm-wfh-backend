import { Knex } from 'knex';

export const up = function (knex: Knex): Promise<void> {
    return knex.schema.createTable('Credentials', (table) => {
        table.integer('Staff_ID').notNullable(); // Foreign key to Employees
        table.string('Dept').notNullable();
        table.string('Role').notNullable(); // Store role
        
        // Define composite primary key (Staff_ID + Role)
        table.primary(['Staff_ID', 'Role']);

        // Foreign key to Employees table, using both Staff_ID and Role
        table.foreign(['Staff_ID', 'Role', 'Dept'])
            .references(['Staff_ID', 'Role', 'Dept'])
            .inTable('Employees')
            .onDelete('CASCADE');

        table.string('hashed_password').notNullable(); // Hashed password
        table.timestamp('last_updated').defaultTo(knex.fn.now()); // Password last updated timestamp
    });
};

export const down = function (knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('Credentials'); // Drop Credentials table when rolling back
};


