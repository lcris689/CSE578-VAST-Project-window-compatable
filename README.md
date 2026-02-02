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

The following instructions are for ubuntu system

STEP 1 : Install Java version >= 1.8 and set up the JAVA_HOME environment variable. 
link: https://askubuntu.com/questions/175514/how-to-set-java-home-for-java. To check whether
set up is done, run the command echo $JAVA_HOME on your command line. You should see the
path.

STEP 2 : Download Hadoop-2.7.7 from the link: https://archive.apache.org/dist/hadoop/common/hadoop-
2.7.7/hadoop-2.7.7.tar.gz and extract it to your desired location. Now, you need to set up the
HADOOP_HOME environment variable. Run the command sudo nano ~/.bashrc on the command
line. Copy the statement export HADOOP_HOME=path to the folder hadoop-2.7.7 in the opened
file. Save and close the file. Run the command source ~/.bashrc and check the correctness of the
setup with echo $HADOOP_HOME command.

STEP 3 : Download Spark-3.0.3 from the link: https://archive.apache.org/dist/spark/spark-3.0.3/spark-3.0.3-
bin-hadoop2.7.tgz and extract it to your desired location. Now, you need to set up the
SPARK_HOME environment variable. Run the command sudo nano ~/.bashrc on the command
line. Copy the statement export SPARK_HOME=path to the folder spark-3.0.3-bin-hadoop2.7 in
the opened file. Save and close the file. Run the command source ~/.bashrc and check the
correctness of the setup with echo $SPARK_HOME command. If you browse the path to the
SPARK_HOME, you should see spark-submit under the bin folder which is required for your
testing.

STEP 4 : Install Python, and Pip then install the two dependency library using 

```
pip install Flask
pip install apache-sedona[spark]

```

STEP 5 : make a foler called data and copy the dataset from MC VAST challenge 2022,
Change the Activity Logs folder to ActivityLogs and Add the travelJournal.csv to Attributes folder,
run makeDB.py

```
python3 makeDB.py
```

STEP 6 : start the flask server using server.py
```
export FLASK_APP=server.py
flask run
```

open the index.html using live server to see the whole system.

