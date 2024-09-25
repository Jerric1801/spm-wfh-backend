
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
import { Knex } from 'knex';

interface RequestRow {
  Request_ID: number;
  Staff_ID: number;
  Dept: string;
  Current_Status: string;
  Created_At: string;
  Updated_At: string;
  Superviser_ID: number;
}

export const seed = async (knex: Knex): Promise<void> => {
  const requests: RequestRow[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'Request.csv'))
      .pipe(csv())
      .on('data', (row: RequestRow) => {
        requests.push({
          Request_ID: row.Request_ID,
          Staff_ID: row.Staff_ID,
          Dept: row.Dept,
          Current_Status: row.Current_Status,
          Created_At: row.Created_At,
          Updated_At: row.Updated_At,
          Superviser_ID: row.Superviser_ID
        });
      })
      .on('end', async () => {
        await knex('Request').del();  // Deletes all existing entries
        await knex('Request').insert(requests);  // Inserts new data
        resolve();
      })
      .on('error', reject);
  });
};
