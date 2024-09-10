const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

exports.seed = function(knex) {
  const employees = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'data', 'employee.csv'))
      .pipe(csv())
      .on('data', (row) => {
        employees.push({
          Staff_ID: row.Staff_ID,
          Staff_FName: row.Staff_FName,
          Staff_LName: row.Staff_LName,
          Dept: row.Dept,
          Position: row.Position,
          Country: row.Country,
          Email: row.Email,
          Reporting_Manager: row.Reporting_Manager,
          Role: row.Role,
        });
      })
      .on('end', async () => {
        try {
          await knex('Employees').insert(employees);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
  });
};