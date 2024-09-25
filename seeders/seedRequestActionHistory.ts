
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
import { Knex } from 'knex';

interface RequestActionHistoryRow {
  Request_ID: number;
  Status: string;
  Reason: string;
  Updated_At: string;
  Updated_By: number;
}

export const seed = async (knex: Knex): Promise<void> => {
  const requestActionHistories: RequestActionHistoryRow[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'RequestActionHistory.csv'))
      .pipe(csv())
      .on('data', (row: RequestActionHistoryRow) => {
        requestActionHistories.push({
          Request_ID: row.Request_ID,
          Status: row.Status,
          Reason: row.Reason,
          Updated_At: row.Updated_At,
          Updated_By: row.Updated_By
        });
      })
      .on('end', async () => {
        await knex('RequestActionHistory').del();  // Deletes all existing entries
        await knex('RequestActionHistory').insert(requestActionHistories);  // Inserts new data
        resolve();
      })
      .on('error', reject);
  });
};
