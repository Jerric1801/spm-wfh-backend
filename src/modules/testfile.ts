import { fetchRequestsByDate, fetchRequestsByDateApproved, fetchRequestsByDeptDate,
     fetchRequestsByWFHDetails, fetchEmployeesWFOByDate, countEmployeesWFOByDate, countEmployeesWFHByDate } 
     from '../modules/request'; // Adjust path based on your directory structure

async function runTests() {
    try {
        console.log("Fetching requests by date:");
        const requestsByDate = await fetchRequestsByDate("2024-11-06");
        console.log(requestsByDate);

        console.log("Fetching approved requests by date:");
        const approvedRequests = await fetchRequestsByDateApproved('2024-08-08');
        console.log(approvedRequests);

        console.log("Fetching requests by department and date:");
        const requestsByDept = await fetchRequestsByDeptDate('Engineering', '2024-08-08', 'Approved');
        console.log(requestsByDept);

        console.log("Fetching requests by WFH details:");
        const wfhDetails = await fetchRequestsByWFHDetails('AM', 'Approved', '2024-12-21');
        console.log(wfhDetails);

        console.log("Fetching employees working from office by date:");
        const employeesWFO = await fetchEmployeesWFOByDate('2024-10-01');
        console.log(employeesWFO);

        console.log("Counting employees working from office by date:");
        const countWFO = await countEmployeesWFOByDate('2024-10-01');
        console.log(`Number of employees in the office: ${countWFO}`);

        console.log("Counting employees working from home by date:");
        const countWFH = await countEmployeesWFHByDate('2024-10-01');
        console.log(`Number of employees WFH: ${countWFH}`);

    } catch (error) {
        console.error("Error running tests:", error);
    }
}

// Run all the tests
runTests();