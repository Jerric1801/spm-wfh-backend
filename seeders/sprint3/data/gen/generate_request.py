import csv
import random
from datetime import datetime, timedelta
from dateutil.rrule import rrule, WEEKLY

request_reasons = [
    "Focused work environment at home.",
    "Better work-life balance.",
    "Save time and reduce stress by not commuting.",
    "Fewer distractions at home.",
    "Flexibility for appointments or deliveries.",
    "Home maintenance or repairs.",
    "Family obligations.",
    "Quiet environment for focused work.",
    "Bad weather or traffic.",
    "Online training or conference.",
    "Slight illness but can still work.",
    "Unexpected disruption at home.",
    "Personal errands.",
    "More comfortable working from home.",
    "Prefer the home office setup.",
    "Increased efficiency at home.",
    "Better concentration and productivity.",
    "No commute allows for earlier start.",
    "Can work during off-peak hours.",
    "More time for family or personal life."
]

def get_random_manager_reason():
  """Returns a random manager reason for rejecting a request."""
  reasons = [
      "Insufficient justification for WFH.",
      "Team needs to collaborate in person.",
      "WFH not suitable for this role.",
      "Company policy does not allow WFH on this day.",
      "Request conflicts with other schedules."
  ]
  return random.choice(reasons)


def generate_seed_data(employees_csv, start_date, end_date, num_requests):
  """
  Generates seed data for the Request and RequestDetails tables.

  Args:
    employees_csv: Path to the employees.csv file.
    start_date: Start date for the requests (YYYY-MM-DD).
    end_date: End date for the requests (YYYY-MM-DD).
    num_requests: Number of requests to generate.

  Returns:
    A tuple containing lists of dictionaries for Request and RequestDetails data.
  """

  # Load employee data from CSV
  employees = []
  with open(employees_csv, 'r') as file:
    reader = csv.DictReader(file)
    for row in reader:
      employees.append(row)

  # Convert dates to datetime objects
  start_date = datetime.strptime(start_date, '%Y-%m-%d')
  end_date = datetime.strptime(end_date, '%Y-%m-%d')

  requests = []
  request_details = []
  request_id = 1

  for _ in range(num_requests):
    # Choose a random employee
    employee = random.choice(employees)

    # Find the employee's manager
    manager_id = employee['Reporting_Manager']

    # Generate a random date within the specified range
    random_days = random.randrange((end_date - start_date).days)
    request_date = start_date + timedelta(days=random_days)
    status_choices = ['Pending', 'Approved', 'Rejected']
    status_weights = [0.3, 0.6, 0.1]
    # Create request data
    request = {
        'Request_ID': request_id,
        'Staff_ID': employee['Staff_ID'],
        'Current_Status': random.choices(status_choices, status_weights)[0],
        'Created_At': datetime.now().strftime('%Y-%m-%d'),
        'Last_Updated': datetime.now().strftime('%Y-%m-%d'),
        'Request_Reason': random.choice(request_reasons),
        'Manager_Reason': ''  
    }

    if request['Current_Status'] == 'Rejected':
      request['Manager_Reason'] = get_random_manager_reason()

    requests.append(request)

    # Create request details data
    num_weeks = random.randint(1, 4)  # Generate 1 to 4 weeks per request
    weekdays = random.sample([0, 1, 2, 3, 4, 5, 6], random.randint(1, 3)) # Select 1 to 3 weekdays

    # Ensure the first date is within the specified range and adjust if necessary
    first_date_days = random.randrange((end_date - start_date).days)
    first_date = start_date + timedelta(days=first_date_days)
    if first_date + timedelta(weeks=num_weeks) > end_date:
        first_date = end_date - timedelta(weeks=num_weeks)

    wfh_type = random.choice(['WD', 'AM', 'PM'])

    for day in weekdays:
      for request_date in rrule(WEEKLY, dtstart=first_date, count=num_weeks, byweekday=day):
        request_detail = {
            'Request_ID': request_id,
            'Date': request_date.strftime('%Y-%m-%d'),
            'WFH_Type': wfh_type
        }
        request_details.append(request_detail)

    request_id += 1

  return requests, request_details


if __name__ == "__main__":
  employees_csv = '../employee.csv'  # Replace with your CSV file path
  start_date = '2024-06-01'
  end_date = '2025-02-25'
  num_requests = 3000 

  requests, request_details = generate_seed_data(employees_csv, start_date, end_date, num_requests)

  with open('../additional_request.csv', 'w', newline='') as requests_file:
    fieldnames = ['Request_ID', 'Staff_ID', 'Current_Status', 'Created_At', 'Last_Updated', 'Request_Reason', 'Manager_Reason']
    writer = csv.DictWriter(requests_file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(requests)

  with open('../additional_request_details.csv', 'w', newline='') as details_file:
    fieldnames = ['Request_ID', 'Date', 'WFH_Type']
    writer = csv.DictWriter(details_file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(request_details)

  print("Data written to requests.csv and request_details.csv")