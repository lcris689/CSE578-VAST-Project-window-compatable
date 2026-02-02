#import findspark
#findspark.init()

from flask import Flask, jsonify
import json
from pyspark import StorageLevel
from pyspark.sql import SparkSession
from sedona.register import SedonaRegistrator
from sedona.utils import SedonaKryoRegistrator, KryoSerializer
import numpy as np


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



app = Flask(__name__)

@app.route("/getBuildings")
def get_buildings2():
    buildings = spark.sql(
      "SELECT buildingid as id,buildingtype, ST_AsGeoJSON(st_geomFromWKT(location)) as geometry from project.buildings")
    data = buildings.toPandas().to_dict(orient = 'records')
    for item in data:
        item['type'] = "Feature"
        item['id'] = int(item['id'])
        item['geometry'] = json.loads(item['geometry'])
    
    response = jsonify(data)
    
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

@app.route("/getXYZ")
def get_XYZ():
    xyz = spark.sql(
      'SELECT apartmentId, collect_list(participantId) AS participants FROM (SELECT apartmentId, participantId from project.activitylogs WHERE date(timestamp) BETWEEN "2022-03-01" AND "2022-04-01" GROUP BY apartmentId, participantId) GROUP by apartmentId')
    data = xyz.toPandas().to_dict(orient = 'records')
    for item in data:
        item['participants'] = list(item['participants'])
    
    response = jsonify(data)
    
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


@app.route("/getJoviality")
def get_Joviality():
    joviality = spark.sql(
      'SELECT participantId, joviality FROM project.participants')
    data = joviality.toPandas().to_dict(orient = 'records')
    response = jsonify(data)
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

@app.route("/getPubs")
def get_pubs():
    pubs = spark.sql(
      "SELECT pubid, buildingid, hourlycost, maxoccupancy, ST_X(st_geomFromWKT(location)) as pointX, ST_Y(st_geomFromWKT(location)) as pointY from project.pubs")
    data = pubs.toPandas().to_dict(orient = 'records')
    response = jsonify(data)
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

@app.route("/getTravelTime")
def get_travelTime():
    pubs = spark.sql(
      "SELECT DATE(travelstarttime) as date,  sum(unix_timestamp(travelendtime) - unix_timestamp(travelstarttime)) as value  FROM project.TravelJournal group by date order by date")
    data = pubs.toPandas().to_dict(orient = 'records')
    response = jsonify(data)
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

@app.route("/getRestaurants")
def get_restaurants():
    pubs = spark.sql(
      "SELECT restaurantid, buildingid, foodcost, maxoccupancy, ST_X(st_geomFromWKT(location)) as pointX, ST_Y(st_geomFromWKT(location)) as pointY from project.restaurants")
    data = pubs.toPandas().to_dict(orient = 'records')
    response = jsonify(data)
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

@app.route("/getApartments")
def get_apartments():
    pubs = spark.sql('SELECT apartmentId,rentalCost,maxOccupancy,numberOfRooms,buildingId, ST_X(st_geomFromWKT(location)) as xLoc, ST_Y(st_geomFromWKT(location)) as yLoc FROM project.apartments')
    data = pubs.toPandas().to_dict(orient = 'records')
    response = jsonify(data)
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

@app.route("/getTravelJournal/<date>")
def get_travelJournal(date):
    pubs = spark.sql('SELECT participantId, travelStartTime, travelEndTime, purpose FROM project.TravelJournal WHERE DATE(travelStartTime) == "'+date+'"')
    data = pubs.toPandas().to_dict(orient = 'records')
    response = jsonify(data)
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

@app.get('/getCheckins/<venueId>')
def getCheckin(venueId):
  sql = 'SELECT DAYOFWEEK(date) as day, hour, sum(kidpeople) as kidpeople, sum(nokidpeople) as nokidpeople FROM (SELECT DATE(timestamp) as date, HOUR(timestamp) as hour, count(case havekids when "TRUE" then 1 else null end) as kidpeople, count(case havekids when "FALSE" then 1 else null end) as nokidpeople FROM project.participants as a INNER JOIN (SELECT participantid, timestamp FROM project.checkinjournal where venueid='+venueId+') as b ON a.participantid=b.participantid GROUP BY date, hour) GROUP BY day, hour'
  checks = spark.sql(sql)
  data = checks.toPandas().to_dict(orient = 'records')
  response = jsonify(data)
  response.headers.add("Access-Control-Allow-Origin", "*")
  return response

@app.get('/getPeople/<date>')
def getPeople(date):
  sql = 'SELECT participantID, timestamp, ST_X(st_geomFromWKT(currentLocation)) as xLoc, ST_Y(st_geomFromWKT(currentLocation)) as yLoc FROM project.activitylogs WHERE date(timestamp)="'+date +'" order by timestamp'
  checks = spark.sql(sql)
  data = checks.toPandas().to_dict(orient = 'records')
  response = jsonify(data)
  response.headers.add("Access-Control-Allow-Origin", "*")
  return response

if __name__ == '__main__':
  app.run(debug=True)
 