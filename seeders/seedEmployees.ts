import csv from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';
import { Knex } from 'knex';

interface EmployeeRow {
  Staff_ID: string;
  Staff_FName: string;
  Staff_LName: string;
  Dept: string;
  Position: string;
  Country: string;
  Email: string;
  Reporting_Manager: string;
  Role: string;
}

export const seed = async (knex: Knex): Promise<void> => {
  const employees: EmployeeRow[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'data', 'employee.csv'))
      .pipe(csv())
      .on('data', (row: EmployeeRow) => {
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
