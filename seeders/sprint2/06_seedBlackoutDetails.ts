const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
import { Knex } from 'knex';

interface BlackoutDetailsRow {
  Blackout_ID: number;
  Date: string; 
  Timeblock: string;
}

export const seed = async (knex: Knex): Promise<void> => {
  const blackoutDetails: BlackoutDetailsRow[] = [];

  const [{ count }] = await knex('BlackoutDetails').count('* as count');

  if (Number(count) > 0) {
    console.log('Seeding already done for BlackoutDetails Table');
    return;
  }

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'data', 'blackout_details.csv')) // Assuming your CSV is named 'blackout_details.csv'
      .pipe(csv())
      .on('data', (row: BlackoutDetailsRow) => {
        blackoutDetails.push({
          Blackout_ID: row.Blackout_ID,
          Date: row.Date, 
          Timeblock: row.Timeblock,
        });
      })
      .on('end', async () => {
        try {
          await knex('BlackoutDetails').insert(blackoutDetails);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
  });
};