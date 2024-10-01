import { fetchRequestsByDate, 
  fetchRequestsByDateApproved, 
  fetchRequestsByDeptDate, 
  fetchRequestsByWFHDetails, 
  fetchEmployeesWFOByDate, 
  countEmployeesWFOByDate, 
  countEmployeesWFHByDate } 
  from '../modules/request'; 
test('read data and returns a list of employees wfh given the date',async ()=>{

  const result = await fetchRequestsByDate("2024-11-06");
 expect(result).toEqual(
  [
    {
      Request_ID: 2,
      Staff_ID: 151596,
      Dept: 'Finance',
      Current_Status: 'Approved',
      Created_At: new Date('2024-11-05T16:00:00.000Z'),
      Updated_At: new Date('2024-01-09T16:00:00.000Z'),
      Superviser_ID: 140879
    },
    {
      Request_ID: 36,
      Staff_ID: 151450,
      Dept: 'Solutioning',
      Current_Status: 'Rejected',
      Created_At: new Date('2024-11-05T16:00:00.000Z'),
      Updated_At: new Date('2024-03-14T16:00:00.000Z'),
      Superviser_ID: 171043
    }
  ]
  );
});
// Test suite for fetchRequestsByDateApproved
test('fetchRequestsByDateApproved should return a list of approved requests for a given date', async () => {
  const result = await fetchRequestsByDateApproved('2024-08-08');
  
  expect(result).toEqual([
    {
      Request_ID: 4,
      Staff_ID: 140880,
      Dept: 'Engineering',
      Current_Status: 'Approved',
      Created_At: new Date('2024-06-06T16:00:00.000Z'),
      Updated_At: new Date('2024-02-03T16:00:00.000Z'),
      Superviser_ID: 180001,
      WFH_StartDate: new Date('2024-08-07T16:00:00.000Z'),
      WFH_EndDate: new Date('2024-08-02T16:00:00.000Z'),
      Type_WFH: 'AM'
    }
  ]);
});

// Test suite for fetchRequestsByDeptDate
test('fetchRequestsByDeptDate should return requests for a given department and date with specified status', async () => {
  const result = await fetchRequestsByDeptDate('Engineering', '2024-08-08', 'Approved');
  
  expect(result).toEqual([
    {
      Request_ID: 4,
      Staff_ID: 140880,
      Dept: 'Engineering',
      Current_Status: 'Approved',
      Created_At: new Date('2024-06-06T16:00:00.000Z'),
      Updated_At: new Date('2024-02-03T16:00:00.000Z'),
      Superviser_ID: 180001,
      WFH_StartDate: new Date('2024-08-07T16:00:00.000Z'),
      WFH_EndDate: new Date('2024-08-02T16:00:00.000Z'),
      Type_WFH: 'AM'
    }
  ]);
});

// Test suite for fetchRequestsByWFHDetails
test('fetchRequestsByWFHDetails should return WFH details for a given time, status, and date', async () => {
  const result = await fetchRequestsByWFHDetails('AM', 'Approved', '2024-12-21');
  
  expect(result).toEqual([
    {
      Request_ID: 39,
      Staff_ID: 190057,
      Dept: 'Engineering',
      Current_Status: 'Approved',
      Created_At: new Date("2024-09-27T16:00:00.000Z"),
      Updated_At: new Date("2024-08-25T16:00:00.000Z"),
      Superviser_ID: 160008,
      WFH_StartDate: new Date("2024-12-20T16:00:00.000Z"),
      WFH_EndDate: new Date("2024-01-21T16:00:00.000Z"),
      Type_WFH: 'AM'
    }
  ]);
});

// Test suite for fetchEmployeesWFOByDate
test('fetchEmployeesWFOByDate should return employees working from the office for a given date', async () => {
  const result = await fetchEmployeesWFOByDate('2024-10-01');
  
  // Instead of testing the full list, we'll confirm the function returns a list
  // Assuming the list is too long, just check that it returns an array and not null or undefined
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBeGreaterThan(0);
});

// Test suite for countEmployeesWFOByDate
test('countEmployeesWFOByDate should return the count of employees working from the office for a given date', async () => {
  const result = await countEmployeesWFOByDate('2024-10-01');
  
  expect(result).toBe("559"); // There are 559 employees working from the office on this date
});

// Test suite for countEmployeesWFHByDate
test('countEmployeesWFHByDate should return the count of employees working from home for a given date', async () => {
  const result = await countEmployeesWFHByDate('2024-10-01');
  
  expect(result).toBe("0"); // There are 0 employees working from home on this date
});

// Test suite for fetchRequestsByDate - expected failure when passing an invalid date
test('fetchRequestsByDate should throw an error for invalid date format', async () => {
  await expect(fetchRequestsByDate('invalid-date')).rejects.toThrow(); // Expect the function to throw an error
});

// Test suite for fetchRequestsByDateApproved - expected failure when passing an invalid date format
test('fetchRequestsByDateApproved should throw an error for invalid date format', async () => {
  await expect(fetchRequestsByDateApproved('invalid-date')).rejects.toThrow(); // Expect an exception
});

// Test suite for fetchRequestsByWFHDetails - expected failure when invalid date format is passed
test('fetchRequestsByWFHDetails should throw an error for invalid date format', async () => {
  await expect(fetchRequestsByWFHDetails('AM', 'Approved', 'invalid-date')).rejects.toThrow(); // Expect an exception
});

// Test suite for fetchEmployeesWFOByDate - expected failure when date format is incorrect
test('fetchEmployeesWFOByDate should throw an error for invalid date format', async () => {
  await expect(fetchEmployeesWFOByDate('invalid-date')).rejects.toThrow(); // Expect an error to be thrown
});

// Test suite for countEmployeesWFOByDate - expected failure when passing invalid date
test('countEmployeesWFOByDate should throw an error for invalid date format', async () => {
  await expect(countEmployeesWFOByDate('invalid-date')).rejects.toThrow(); // Invalid date should throw
});

// Test suite for countEmployeesWFHByDate - expected failure when date format is incorrect
test('countEmployeesWFHByDate should throw an error for invalid date format', async () => {
  await expect(countEmployeesWFHByDate('invalid-date')).rejects.toThrow(); // Expect an exception for invalid date
});