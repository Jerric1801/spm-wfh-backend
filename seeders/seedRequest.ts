const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
import { Knex } from 'knex';

interface RequestRow {
  Request_ID: number;
  Staff_ID: number;
  Current_Status: string;
  Created_At: string;   // 'YYYY-MM-DD' formatted string
  Last_Updated: string; // 'YYYY-MM-DD' formatted string
}

export const seed = async (knex: Knex): Promise<void> => {
  const requests: RequestRow[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'data', 'request.csv'))
      .pipe(csv())
      .on('data', (row: RequestRow) => {
        // Push each row into the requests array
        requests.push({
          Request_ID: row.Request_ID,
          Staff_ID: row.Staff_ID,
          Current_Status: row.Current_Status,
          Created_At: row.Created_At,   // Using 'Created_At' from CSV
          Last_Updated: row.Last_Updated // Using 'Last_Updated' from CSV
        });
      })
      .on('end', async () => {
        try {
          // Insert the collected rows into the Request table
          await knex('Request').insert(requests);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
  });
};
