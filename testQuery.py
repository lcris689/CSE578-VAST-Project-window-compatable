#import findspark
#findspark.init()

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


df = spark.sql('SELECT  participantID, purpose, sum((startingBalance) - (endingBalance)) as moneySpent  FROM project.TravelJournal group by participantID, purpose').show(10)

# df = spark.sql('SELECT apartmentId, collect_list(participantId) FROM (SELECT apartmentId, participantId from project.activitylogs WHERE date(timestamp) = "2022-03-01" GROUP BY apartmentId, participantId)').show(10)
df = spark.sql('SELECT apartmentId, collect_list(participantId) FROM (SELECT apartmentId, participantId from project.activitylogs WHERE date(timestamp) BETWEEN "2022-03-01" AND "2022-04-01" GROUP BY apartmentId, participantId) GROUP by apartmentId').show(10)
# df2 = spark.sql('SELECT * FROM project.TravelJournal').show(10)
