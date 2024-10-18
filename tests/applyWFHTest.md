# Test Cases for applyWFH Endpoint

| **Test Case** | **Description**                     | **Input**                                                                                                                               | **Expected Output**                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|---------------|-------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Test 1**    | Valid Input                         | ```json { "dateRange": { "startDate": "2024-10-14", "endDate": "2024-10-20" }, "wfhType": "AM", "reason": "EXAMPLE REASON" }```         | Status Code: 200 ```json { "message": "Work-from-home request submitted successfully", "data": { "details": [ { "Request_ID": <Auto-generated>, "Date": "2024-10-14", "WFH_Type": "AM" }, { "Request_ID": <Auto-generated>, "Date": "2024-10-15", "WFH_Type": "AM" }, { "Request_ID": <Auto-generated>, "Date": "2024-10-16", "WFH_Type": "AM" }, { "Request_ID": <Auto-generated>, "Date": "2024-10-17", "WFH_Type": "AM" }, { "Request_ID": <Auto-generated>, "Date": "2024-10-18", "WFH_Type": "AM" }, { "Request_ID": <Auto-generated>, "Date": "2024-10-19", "WFH_Type": "AM" }, { "Request_ID": <Auto-generated>, "Date": "2024-10-20", "WFH_Type": "AM" } ] } }```              |
| **Test 2**    | Missing Required Fields - No `dateRange` | ```json { "wfhType": "AM", "reason": "EXAMPLE REASON" }```                                                                              | Status Code: 400 ```json { "message": "Please provide dateRange, wfhType, and reason." }```                                                                                                                                                                                                                                                                                                                                                               |
| **Test 3**    | Missing Required Fields - No `startDate` | ```json { "dateRange": { "endDate": "2024-10-20" }, "wfhType": "AM", "reason": "EXAMPLE REASON" }```                                    | Status Code: 400 ```json { "message": "Please provide dateRange, wfhType, and reason." }```                                                                                                                                                                                                                                                                                                                                                               |
| **Test 4**    | Missing Required Fields - No `endDate`   | ```json { "dateRange": { "startDate": "2024-10-14" }, "wfhType": "AM", "reason": "EXAMPLE REASON" }```                                  | Status Code: 400 ```json { "message": "Please provide dateRange, wfhType, and reason." }```                                                                                                                                                                                                                                                                                                                                                               |
| **Test 5**    | Missing Required Fields - No `wfhType`   | ```json { "dateRange": { "startDate": "2024-10-14", "endDate": "2024-10-20" }, "reason": "EXAMPLE REASON" }```                          | Status Code: 400 ```json { "message": "Please provide dateRange, wfhType, and reason." }```                                                                                                                                                                                                                                                                                                                                                               |
| **Test 6**    | Missing Required Fields - No `reason`    | ```json { "dateRange": { "startDate": "2024-10-14", "endDate": "2024-10-14" }, "wfhType": "AM" }```                                     | Status Code: 400 ```json { "message": "Please provide dateRange, wfhType, and reason." }```                                                                                                                                                                                                                                                                                                                                                               |
| **Test 7**    | Invalid `wfhType`                       | ```json { "dateRange": { "startDate": "2024-10-14", "endDate": "2024-10-20" }, "wfhType": "INVALID", "reason": "EXAMPLE REASON" }```    | Status Code: 400 ```json { "message": "Invalid wfhType. Must be one of AM, PM, or FD." }```                                                                                                                                                                                                                                                                                                                                                                |
| **Test 8**    | Invalid `dateRange` - `endDate` before `startDate` | ```json { "dateRange": { "startDate": "2024-10-20", "endDate": "2024-10-14" }, "wfhType": "AM", "reason": "EXAMPLE REASON" }```        | Status Code: 400 ```json { "message": "endDate must be the same or after startDate." }```                                                                                                                                                                                                                                                                                                                                                                 |
| **Test 9**    | Edge Case - Single Day                 | ```json { "dateRange": { "startDate": "2024-10-14", "endDate": "2024-10-14" }, "wfhType": "PM", "reason": "Doctor's Appointment" }```   | Status Code: 200 ```json { "message": "Work-from-home request submitted successfully", "data": { "details": [ { "Request_ID": <Auto-generated>, "Date": "2024-10-14", "WFH_Type": "PM" } ] } }```                                                                                                                                                                                                                                                           |
| **Test 10**   | Edge Case - Long Date Range             | ```json { "dateRange": { "startDate": "2024-01-01", "endDate": "2024-12-31" }, "wfhType": "WD", "reason": "Year-long project" }```      | Status Code: 200 ```json { "message": "Work-from-home request submitted successfully", "data": { "details": [ // This would list each day within the date range with WFH_Type: "WD" ] } }```                                                                                                                                                                                                                                                               |