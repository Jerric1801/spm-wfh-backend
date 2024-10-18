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
  Request_Reason: string;
  Manager_Reason: string;
}

export const seed = async (knex: Knex): Promise<void> => {
  const requests: RequestRow[] = [];

  const [{ count }] = await knex('Request').count('* as count'); 

  if (Number(count) > 0) {
    console.log('Seeding already done for Request Table');
    return; 
  }

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'data', 'additional_request.csv'))
      .pipe(csv())
      .on('data', (row: RequestRow) => {
        // Push each row into the requests array
        requests.push({
          Request_ID: row.Request_ID,
          Staff_ID: row.Staff_ID,
          Current_Status: row.Current_Status,
          Created_At: row.Created_At,   // Using 'Created_At' from CSV
          Last_Updated: row.Last_Updated, // Using 'Last_Updated' from CSV
          Request_Reason: row.Request_Reason,
          Manager_Reason: row.Manager_Reason
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
