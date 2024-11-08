# All-In-One WFH System Backend 🖨️ 

All-In-One, a printing solution company, wants to develop a web application to manage and track work-from-home (WFH) arrangements. The current Excel-based tracking system lacks governance, leading to confusion. The new system should allow staff to request regular or ad-hoc WFH days, include an approval process, and provide visibility for management to track staff availability in the office, addressing flexibility without productivity loss.

Visit our Frontend Repository: [spm-wfh-frontend](https://github.com/Jerric1801/spm-wfh-frontend) 🔗

Visit All-In-One WFH 🚀: [All-In-One](https://aioworkfromhome.site/) 🔗

## IS212 Software Project Management Backend 🗓️

1. **Prerequisites:**

   * **Docker:** Make sure you have Docker and Docker Compose installed on your system.
   * **Node.js and npm:** Required for running tests.

2. Clone the repository:
   
   `git clone https://github.com/Jerric1801/spm-wfh-backend.git`

3. Navigate to the project directory:

   `cd spm-wfh-backend`

4. **Important:** Create a `.env` file in the root directory by referring to the `.env.example` file.

5. Run with Docker 🏃:

   * **macOS/Linux:** `./start-all.sh` 
   * **Windows:** `./start-all.bat`

   * These scripts will build the Docker containers and start all services in detached mode.

6. Stop running 🚥:
   
   * **macOS/Linux:** `./stop-all.sh` 
   * **Windows:** `./stop-all.bat`

7. **Running Tests:**

   * Navigate to the root directory.
   * Run `npm install` to install the necessary dependencies.
   * Execute the tests using `npm test`.

**Note:** 

* The `start-all.sh` and `start-all.bat` scripts automate the building and running of the application using Docker. 
* The CI pipeline script is located in `.github/workflows/node.js.yml`.