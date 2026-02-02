import findspark
findspark.init()

from pyspark import StorageLevel
from pyspark.sql import SparkSession
from sedona.register import SedonaRegistrator
from sedona.utils import SedonaKryoRegistrator, KryoSerializer
import numpy as np
from pyspark.sql.functions import *


spark = SparkSession.\
    builder.\
    master("local[*]").\
    appName("Sedona App").\
    config("spark.serializer", KryoSerializer.getName).\
    config("spark.kryo.registrator", SedonaKryoRegistrator.getName).\
    config("spark.jars.packages", "org.apache.sedona:sedona-python-adapter-3.0_2.12:1.2.0-incubating,org.datasyslab:geotools-wrapper:geotools-24.0").\
    enableHiveSupport(). \
    getOrCreate()


SedonaRegistrator.registerAll(spark)
sc = spark.sparkContext
sc.setSystemProperty("sedona.global.charset", "utf8")

spark.sql("CREATE DATABASE IF NOT EXISTS project")

data = spark.\
    read.\
    option("delimiter", ",").\
    option("header", "true").\
    csv("data/Attributes/Participants.csv")

data.write.saveAsTable("project.Participants")


data = spark.\
    read.\
    option("delimiter", ",").\
    option("header", "true").\
    csv("data/Attributes/Buildings.csv")

data.write.saveAsTable("project.Buildings")

data = spark.\
    read.\
    option("delimiter", ",").\
    option("header", "true").\
    csv("data/Attributes/Apartments.csv")

data.write.saveAsTable("project.Apartments")



data = spark.\
    read.\
    option("delimiter", ",").\
    option("header", "true").\
    csv("data/Attributes/Pubs.csv")

data.write.saveAsTable("project.Pubs")


data = spark.\
    read.\
    option("delimiter", ",").\
    option("header", "true").\
    csv("data/Attributes/Schools.csv")

data.write.saveAsTable("project.Schools")

data = spark.\
    read.\
    option("delimiter", ",").\
    option("header", "true").\
    csv("data/Attributes/Restaurants.csv")

data.write.saveAsTable("project.Restaurants")

data = spark.\
    read.\
    option("delimiter", ",").\
    option("header", "true").\
    csv("data/Attributes/CheckinJournal.csv")

data2 = data.withColumn('timestamp', regexp_replace(regexp_replace('timestamp', 'Z', ''), 'T', ' ')).alias("timestamp")

data2.write.saveAsTable("project.CheckinJournal")

data = spark.\
    read.\
    option("delimiter", ",").\
    option("header", "true").\
    csv("data/ActivityLogs/ParticipantStatusLogs1.csv")

data2 = data.withColumn('timestamp', regexp_replace(regexp_replace('timestamp', 'Z', ''), 'T', ' ')).alias("timestamp2")

data2.write.saveAsTable("project.activitylogs")

data = spark.\
    read.\
    option("delimiter", ",").\
    option("header", "true").\
    csv("data/Journals/TravelJournal.csv")

data2 = data.withColumn('travelStartTime', regexp_replace(regexp_replace('travelStartTime', 'Z', ''), 'T', ' ')).alias("travelStartTime")
data2 = data2.withColumn('travelEndTime', regexp_replace(regexp_replace('travelEndTime', 'Z', ''), 'T', ' ')).alias("travelEndTime")
data2 = data2.withColumn('checkInTime', regexp_replace(regexp_replace('checkInTime', 'Z', ''), 'T', ' ')).alias("checkInTime")
data2 = data2.withColumn('checkOutTime', regexp_replace(regexp_replace('checkOutTime', 'Z', ''), 'T', ' ')).alias("checkOutTime")

data2.write.saveAsTable("project.TravelJournal")

for i in range(2,11):
    data = spark.\
        read.\
        option("delimiter", ",").\
        option("header", "true").\
        csv("data/ActivityLogs/ParticipantStatusLogs"+str(i)+".csv")

    data2 = data.withColumn('timestamp', regexp_replace(regexp_replace('timestamp', 'Z', ''), 'T', ' ')).alias("timestamp")

    data2.write.mode("append").saveAsTable("project.activitylogs")

print(spark.catalog.listTables("project"))