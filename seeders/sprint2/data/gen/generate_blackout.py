import csv
import random
from datetime import datetime, timedelta

def generate_blackout_data(employee_csv_path):
    """
    Generates simulated data for blackout_period.csv and blackout_details.csv 
    based on departments extracted from an employee CSV file.

    Args:
        employee_csv_path (str): Path to the employee CSV file.
    """

    departments = set()
    with open(employee_csv_path, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            departments.add(row['Dept'])

    # Exclude departments that shouldn't have blackout periods
    excluded_departments = {"CEO"}  # Add any other departments to exclude
    departments = departments - excluded_departments

    # Generate blackout_period.csv data
    blackout_periods = []
    blackout_id_counter = 1
    for dept in departments:
        # Simulate 1-2 blackout periods per department
        for _ in range(random.randint(1, 2)):
            reason = random.choice([
                "System Upgrade",
                "Server Maintenance",
                "Network Outage",
                "Office Relocation",
                "Team Building Event",
                "Public Holiday"
            ])
            blackout_periods.append({
                "Blackout_ID": blackout_id_counter,
                "Dept": dept,
                "Reason": reason
            })
            blackout_id_counter += 1

    # Generate blackout_details.csv data
    blackout_details = []
    base_date = datetime(2024, 10, 7)  # Center date
    for period in blackout_periods:
        # Simulate 1-3 days per blackout period
        for i in range(random.randint(1, 3)):
            date = base_date + timedelta(days=random.randint(-40, 40))  
            timeblock = random.choice(["AM", "PM", "WD"])
            blackout_details.append({
                "Blackout_ID": period["Blackout_ID"],
                "Date": date.strftime('%Y-%m-%d'),
                "Timeblock": timeblock
            })

    # Write data to CSV files
    with open('../blackout_period.csv', 'w', newline='') as csvfile:
        fieldnames = ["Blackout_ID", "Dept", "Reason"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(blackout_periods)

    with open('../blackout_details.csv', 'w', newline='') as csvfile:
        fieldnames = ["Blackout_ID", "Date", "Timeblock"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(blackout_details)

# Example usage:
generate_blackout_data('../employee.csv')