import { Knex } from 'knex';
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

interface WFHRequestRow {
    Staff_ID: number;
    Dept: string;
    WFH_StartDate: string;
    WFH_EndDate: string;
    Type_WFH: string;
    Request_Status: string;
    Request_Date: string;
    Modification_Date: string;
    Superviser_ID: number;
    Decision_Date: string;
    Rejection_Reason: string;
    Modification_Reason: string;
}

export const seed = async (knex: Knex): Promise<void> => {
    const wfhRequests: WFHRequestRow[] = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(path.join(__dirname, 'data', 'wfhRequest.csv'))
            .pipe(csv())
            .on('data', (row: WFHRequestRow) => {
                wfhRequests.push({
                    Staff_ID: row.Staff_ID,
                    Dept: row.Dept,
                    WFH_StartDate: row.WFH_StartDate,
                    WFH_EndDate: row.WFH_EndDate,
                    Type_WFH: row.Type_WFH,
                    Request_Status: row.Request_Status,
                    Request_Date: row.Request_Date,
                    Modification_Date: row.Modification_Date,
                    Superviser_ID: row.Superviser_ID,
                    Decision_Date: row.Decision_Date,
                    Rejection_Reason: row.Rejection_Reason,
                    Modification_Reason: row.Modification_Reason
                });
            })
            .on('end', async () => {
                try {
                    await knex('WFHRequests').insert(wfhRequests);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
    });
};