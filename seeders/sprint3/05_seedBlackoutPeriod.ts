const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
import { Knex } from 'knex';

interface BlackoutPeriodRow {
  Blackout_ID: number;
  Dept: string;
  Reason: string;
}

export const seed = async (knex: Knex): Promise<void> => {
  const blackoutPeriods: BlackoutPeriodRow[] = [];

  const [{ count }] = await knex('BlackoutPeriod').count('* as count'); 

  if (Number(count) > 0) {
    console.log('Seeding already done for BlackoutPeriod Table');
    return; 
  }

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'data', 'blackout_period.csv')) 
      .pipe(csv())
      .on('data', (row: BlackoutPeriodRow) => {
        blackoutPeriods.push({
          Blackout_ID: row.Blackout_ID,
          Dept: row.Dept,
          Reason: row.Reason,
        });
      })
      .on('end', async () => {
        try {
          await knex('BlackoutPeriod').insert(blackoutPeriods);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
  });
};