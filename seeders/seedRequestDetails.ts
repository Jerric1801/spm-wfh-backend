const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
import { Knex } from 'knex';

interface RequestDetailsRow {
    Request_ID: number;
    Date: string;          // 'YYYY-MM-DD' formatted string
    WFH_Type: string;      // Work From Home type (e.g., full day, half day)
  }
  
  export const seed = async (knex: Knex): Promise<void> => {
    const requestDetails: RequestDetailsRow[] = [];
  
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, 'data', 'request_details.csv'))
        .pipe(csv())
        .on('data', (row: RequestDetailsRow) => {
          // Push each row into the requestDetails array
          requestDetails.push({
            Request_ID: row.Request_ID,
            Date: row.Date,
            WFH_Type: row.WFH_Type
          });
        })
        .on('end', async () => {
          try {
            // Insert the collected rows into the RequestDetails table
            await knex('RequestDetails').insert(requestDetails);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
    });
  };
  