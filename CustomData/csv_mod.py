import pandas as pd

# read the csv file into a pandas DataFrame
data = pd.read_csv('Jobs.csv')
data1 = pd.read_csv('Employers.csv')

merged_data = pd.merge(data, data1, on='employerId')
print(merged_data)

# group the data by employerId and calculate the average hourlyRate for each group
averages = merged_data.groupby(['employerId', 'location'])['hourlyRate'].mean().round(2)
averages.to_csv('averages.csv', header=['average_hourly_rate'])

