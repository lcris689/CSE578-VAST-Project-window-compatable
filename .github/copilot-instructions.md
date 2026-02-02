# MC VAST Challenge 2022 Visualization System

## Architecture Overview

This is a **geospatial data visualization system** built with:
- **Backend**: Flask + PySpark + Apache Sedona (geospatial queries)
- **Frontend**: D3.js visualizations served via static HTML/CSS/JS
- **Data**: MC VAST Challenge 2022 dataset stored in Spark Hive tables

The system analyzes participant activity, venues (pubs/restaurants), apartments, and travel patterns in a simulated city environment.

## Critical Data Flow

1. **Database Creation** (`makeDB.py`): Reads CSV files from `data/` directory, creates `project.*` Hive tables via Spark
2. **Flask API** (`server.py`): Exposes endpoints querying Hive tables using Sedona SQL with geospatial functions
3. **Frontend**: Static HTML pages fetch data via AJAX from Flask endpoints, render D3.js visualizations

All database tables live in the `project` namespace (e.g., `project.participants`, `project.buildings`).

## Development Workflow

### First-Time Setup (Windows)
```powershell
# Install dependencies (Java 1.8+, Hadoop 2.7.7, Spark 3.0.3)
# Download and extract Hadoop 2.7.7 and Spark 3.0.3 to desired locations
# Set environment variables:
$env:JAVA_HOME = "C:\Path\To\Java"
$env:HADOOP_HOME = "C:\Path\To\hadoop-2.7.7"
$env:SPARK_HOME = "C:\Path\To\spark-3.0.3-bin-hadoop2.7"

# Install Python dependencies
pip install Flask apache-sedona[spark]

# Create data/ folder and add MC VAST dataset:
# - data/Attributes/*.csv (Participants, Buildings, Apartments, etc.)
# - data/ActivityLogs/ParticipantStatusLogs1.csv
# - data/Attributes/travelJournal.csv

# Initialize database
python makeDB.py

# Start Flask server
$env:FLASK_APP = "server.py"
flask run  # Runs on http://127.0.0.1:5000
```

### Running the System
- Start Flask server: `flask run` (or `python server.py` for debug mode)
- Open `index.html` in Live Server or browser (connects to Flask on port 5000)
- Navigate between visualizations via HTML buttons (index, innovative, bottleneck, poi, link, apartments)

## Code Conventions

### Flask API Patterns
- **Every endpoint** adds CORS headers: `response.headers.add("Access-Control-Allow-Origin", "*")`
- Returns JSON via `jsonify(data)` where `data = sparkDF.toPandas().to_dict(orient='records')`
- Geospatial queries use Sedona functions: `ST_AsGeoJSON()`, `ST_X()`, `ST_Y()`, `st_geomFromWKT()`
- Example endpoint structure:
  ```python
  @app.route("/getEndpoint")
  def get_endpoint():
      result = spark.sql("SELECT ... FROM project.tablename")
      data = result.toPandas().to_dict(orient='records')
      response = jsonify(data)
      response.headers.add("Access-Control-Allow-Origin", "*")
      return response
  ```

### Frontend JavaScript Patterns
- All JS files follow same structure:
  - Define SVG dimensions: `width = 1076, height = 1144`
  - Create D3 scales: `xScale`, `yScale` for mapping coordinates
  - Fetch data via `Promise.all([d3.json("http://127.0.0.1:5000/endpoint1"), ...])`
  - Tooltips use `#tip` div with mouseover/mouseout handlers
  - Interactive filters using radio buttons or date selection

### Database Schema Naming
- Table names are lowercase: `project.participants`, `project.activitylogs`, `project.checkinjournal`
- Column names vary: camelCase (`participantId`, `buildingId`) or lowercase (`timestamp`, `location`)
- Geospatial columns stored as WKT strings in `location` field, converted via `st_geomFromWKT()`

## Key Files & Responsibilities

- **server.py**: Flask routes, Spark session initialization, all SQL queries
- **makeDB.py**: One-time database creation from CSV files
- **testQuery.py**: SQL testing/debugging (not part of production flow)
- **js/index.js**: Main visualization (pubs/restaurants map + weekly visit patterns)
- **js/apartments.js**: Apartment analysis with joviality scoring
- **js/bottleneck.js**: Travel bottleneck visualization
- **CustomData/**: Processed CSV files (averages, employers, jobs) for supplementary analysis

## Debugging & Testing

- Test SQL queries in `testQuery.py` before adding to Flask endpoints
- Verify Spark session with: `echo $env:SPARK_HOME`, `echo $env:HADOOP_HOME`
- Check Hive tables: `spark.sql("SHOW TABLES IN project").show()`
- Use `.show()` in PySpark for debugging (e.g., `spark.sql(...).show(10)`)

## Common Gotchas

- **Timestamp format**: Timestamps in CSVs use ISO format with 'Z' and 'T', converted via `regexp_replace('timestamp', 'Z', ''), 'T', ' ')` in makeDB.py
- **GeoJSON conversion**: Buildings use `ST_AsGeoJSON()`, but pubs/restaurants/apartments extract coords with `ST_X()`, `ST_Y()`
- **Hardcoded server URL**: All JS files reference `http://127.0.0.1:5000` - update if Flask port changes
- **ActivityLogs table name**: Created as lowercase `activitylogs` (not `ActivityLogs`)
- **Date filtering**: Use `DATE(timestamp)` in SQL queries, format as `"YYYY-MM-DD"`

## Project Context

Built for CSE 578 Fall 2022 course project analyzing the MC VAST Challenge 2022 dataset. The system visualizes:
1. Venue popularity patterns (pubs, restaurants)
2. Participant movement and travel behavior  
3. Apartment rental patterns and resident joviality
4. Points of interest and traffic bottlenecks
