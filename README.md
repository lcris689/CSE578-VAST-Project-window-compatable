# Aditya-Cristobal-Josue-Pratyush-Raghav-Songyue
#### Dependancies
Java version >= 1.8
Hadoop-2.7.7  https://archive.apache.org/dist/hadoop/common/hadoop-
2.7.7/hadoop-2.7.7.tar.gz
Spark-3.0.3  https://archive.apache.org/dist/spark/spark-3.0.3/spark-3.0.3-
bin-hadoop2.7.tgz

#### Python3 Dependancies
apache-sedona[spark]

Flask

## Instructions to set up and Run the system:

### To create the database: 

The following instructions are for Windows system using PowerShell

STEP 1 : Install Java version >= 1.8 and set up the JAVA_HOME environment variable. 
Download Java JDK and install it. Then set the environment variable in PowerShell:
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-1.8.0_XXX"  # Replace with your Java installation path
```
To check whether setup is done, run the command `echo $env:JAVA_HOME` on your command line. You should see the path.

To set it permanently (recommended), use System Properties:
- Press Win+X, select "System"
- Click "Advanced system settings" → "Environment Variables"
- Add JAVA_HOME with your Java installation path

STEP 2 : Download Hadoop-2.7.7 from the link: https://archive.apache.org/dist/hadoop/common/hadoop-2.7.7/hadoop-2.7.7.tar.gz 
Extract it to your desired location (e.g., `C:\hadoop-2.7.7`). Set up the HADOOP_HOME environment variable:
```powershell
$env:HADOOP_HOME = "C:\hadoop-2.7.7"  # Replace with your extraction path
```
Check the correctness with `echo $env:HADOOP_HOME` command.

For permanent setup, add HADOOP_HOME to System Environment Variables (see STEP 1).

STEP 3 : Download Spark-3.0.3 from the link: https://archive.apache.org/dist/spark/spark-3.0.3/spark-3.0.3-bin-hadoop2.7.tgz 
Extract it to your desired location (e.g., `C:\spark-3.0.3-bin-hadoop2.7`). Set up the SPARK_HOME environment variable:
```powershell
$env:SPARK_HOME = "C:\spark-3.0.3-bin-hadoop2.7"  # Replace with your extraction path
```
Check the correctness with `echo $env:SPARK_HOME` command. If you browse to SPARK_HOME, you should see spark-submit.cmd under the bin folder.

For permanent setup, add SPARK_HOME to System Environment Variables (see STEP 1).

STEP 4 : Install Python, and Pip then install the two dependency libraries using 

```powershell
pip install Flask
pip install apache-sedona[spark]
```

STEP 5 : Make a folder called data and copy the dataset from MC VAST challenge 2022. (https://vast-challenge.github.io/2022/)
Change the Activity Logs folder to ActivityLogs and Add the travelJournal.csv to Attributes folder,
then run makeDB.py

```powershell
python makeDB.py
```

STEP 6 : Start the flask server using server.py
```powershell
$env:FLASK_APP = "server.py"
flask run
```

Open the index.html using Live Server to see the whole system.

