exports.up = function(knex) {
    return knex.schema.createTable('Employees', (table) => {
      table.integer('Staff_ID').primary();
      table.string('Staff_FName');
      table.string('Staff_LName');
      table.string('Dept');
      table.string('Position');
      table.string('Country');
      table.string('Email').unique();
      table.string('Reporting_Manager');
      table.string('Role');
      table.timestamps(true, true);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('Employees');
  };