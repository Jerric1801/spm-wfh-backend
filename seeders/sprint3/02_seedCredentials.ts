import { Knex } from 'knex';
import bcrypt from 'bcryptjs'; // Using bcryptjs instead of bcrypt
import * as path from 'path';
import * as fs from 'fs';
const csv = require('csv-parser');
import config from '../../config/default';

interface CredentialRow {
  Staff_ID: number;
  Dept: string;
  Role: string;
}

export const seed = async (knex: Knex): Promise<void> => {
  const employees: CredentialRow[] = [];

  const [{ count }] = await knex('Credentials').count('* as count'); 

  if (Number(count) > 0) {
    console.log('Seeding already done for Credentials Table');
    return; 
  }
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'data', 'credentials.csv'))
      .pipe(csv())
      .on('data', (row: CredentialRow) => {
        // Push only relevant fields to the employees array
        employees.push({
          Staff_ID: row.Staff_ID,
          Dept: row.Dept,
          Role: row.Role,
        });
      })
      .on('end', async () => {
        try {
          // Fetch the password from the environment variable
          const password = config.mockPassword;

          if (!password) {
            throw new Error('MOCK_PASSWORD is not defined in the environment variables');
          }

          // Hash the password using bcryptjs
          const hashedPassword = await bcrypt.hash(password, 10);

          // Prepare data for insertion
          const credentials = employees.map((employee) => ({
            Staff_ID: employee.Staff_ID,
            Dept: employee.Dept,
            Role: employee.Role,
            hashed_password: hashedPassword,
            last_updated: new Date(),
          }));

          // Deletes all existing entries in Credentials table
          await knex('Credentials').del();

          // Insert the hashed credentials into the Credentials table
          await knex('Credentials').insert(credentials);
          
          console.log('Seeding completed successfully');
          resolve();
        } catch (error) {
          console.error('Error while seeding data', error);
          reject(error);
        }
      })
      .on('error', (error: Error) => {
        console.error('Error while reading CSV file', error);
        reject(error);
      });
  });
};
