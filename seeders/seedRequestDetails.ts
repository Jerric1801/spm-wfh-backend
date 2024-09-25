
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
import { Knex } from 'knex';

interface RequestDetailsRow {
  Request_ID: number;
  WFH_StartDate: string;
  WFH_EndDate: string;
  Type_WFH: string;
}

export const seed = async (knex: Knex): Promise<void> => {
  const requestDetails: RequestDetailsRow[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'RequestDetails.csv'))
      .pipe(csv())
      .on('data', (row: RequestDetailsRow) => {
        requestDetails.push({
          Request_ID: row.Request_ID,
          WFH_StartDate: row.WFH_StartDate,
          WFH_EndDate: row.WFH_EndDate,
          Type_WFH: row.Type_WFH
        });
      })
      .on('end', async () => {
        await knex('RequestDetails').del();  // Deletes all existing entries
        await knex('RequestDetails').insert(requestDetails);  // Inserts new data
        resolve();
      })
      .on('error', reject);
  });
};
