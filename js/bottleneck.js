/************************************
* Sizing                            *
************************************/
const width = 1076, height = 1144;
var margin_1 = { top: 40, right: 40, bottom: 40, left: 40 };
var width_1 = width - margin_1.left - margin_1.right;
var height_1 = height - margin_1.top - margin_1.bottom;

/************************************
* General Global Variables          *
************************************/
var xScale, yScale;
var city_map;
var numberOfParticipants = 1010

/************************************
* Slider                            *
************************************/
var slider = document.getElementById("myRange");
var currentTime = "00:00"
var current_data = new Array(288) // holds data for current day
var dataSelected = []

/************************************
* Bottleneck Variables        *
************************************/
const squareSize = 200;
var bottleneck_svg, ActivityLogsData;
var circles, squares, uniqueSquares, uniqueSquareKeys, 
    tooltip, maxSquareVisitsconst, visitsBySquare, 
    maxParticipantsBySquare, maxParticipantVisits, 
    visitsByParticipantAndLocation, maxCongestion, 
    congestionByLocation, bottleneck_content;
var maxDailySquareVisits = 0;

/************************************
* Data Formatting                   *
************************************/
var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
var formatTime = d3.timeFormat("%H:%M")

/************************************
* Color Scales                      *
************************************/
const colorScale = d3.scaleSequential(d3.interpolateReds).domain([0, 1])
const customColorScale = (value) => {
    if (value >= 0 && value <= 0.3) {
        return d3.scaleSequential(d3.interpolateReds).domain([0, 0.3])/* .range(["#ffff9c", "#efa536"]) */(value);
    } else if (value > 0.3 && value <= 0.6) {
        return d3.scaleSequential(d3.interpolateBlues).domain([0.3, 0.6])/* .range(["#ffaf7a", "#853500"]) */(value);
    } else if (value > 0.6 && value <= 1) {
        return d3.scaleSequential(d3.interpolatePurples).domain([0.6, 1])/* .range(["#fa8072", "#170000"]) */(value);
    }
};

document.addEventListener("DOMContentLoaded", function () {
    /************************************
    * Tooltip                           *
    ************************************/
    tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    /************************************
    * Charts                            *
    ************************************/

    bottleneck_svg = d3
        .select("#bottleneck-svg")
        .attr("width", width_1 + margin_1.left + margin_1.right)
        .attr("height", height_1 + margin_1.top + margin_1.bottom);

    bottleneck_content = bottleneck_svg.append("g");

    /************************************
    * Scales                            *
    ************************************/
    xScale = d3.scaleLinear()
        .range([margin_1.right, width_1-margin_1.left]);
    
    yScale = d3.scaleLinear()
        .range([height_1 - margin_1.top, margin_1.bottom]);
    
    
    Promise.all([
        d3.json("http://127.0.0.1:5000/getBuildings")
    ]).then(function (data) {
        city_map = data[0];
        const allCoordinates = city_map.flatMap(feature => 
            feature.geometry.coordinates[0]
        );
    
        xScale.domain(d3.extent(allCoordinates, coord => coord[0]));
        yScale.domain(d3.extent(allCoordinates, coord => coord[1]));

        drawMap(bottleneck_content);

        d3.selectAll(".vis_titles")
            .text("Loading...");
    });
    
    var date = document.querySelector("#selectedDate").value
    drawViz(date)

    d3.select("#myBtn")
    .on("click", ()=>{
        var date = document.querySelector("#selectedDate").value

        d3.selectAll(".vis_titles")
            .text("Loading...");

        drawViz(date)
    })

});

/* ******************************************************
* Event listner to button                               *
****************************************************** */


/* ******************************************************
* Function to draw vis                                  *
****************************************************** */

function drawViz(date){
    Promise.all([
        d3.json("http://127.0.0.1:5000/getPeople/"+date)
    ]).then(function (data) {
        data[0].forEach(function(d){
            d.date = parseTime(d.timestamp),
            d.time = formatTime(parseTime(d.timestamp)),
            d.xLoc = +d.xLoc,
            d.yLoc = +d.yLoc,
            d.participantId = +d.participantID
        });
        ActivityLogsData = data[0];

        console.log("Drawing for date: ", date)

        visitsByParticipantAndLocation = processData(ActivityLogsData);
        maxParticipantVisits = Math.max(...Array.from(visitsByParticipantAndLocation.values()));

        parseDataDate(ActivityLogsData);
        computeDailyMaxesAtTimestamp(current_data);
        updateSlider();
        addLegend();
        createZoomBehavior(bottleneck_svg, bottleneck_content);
        
    });
}

/* ******************************************************
* Tooltips                                              *
****************************************************** */
function getTooltipHtml(d, visitsByParticipantAndLocation) {
    const key = `${d.participantId},${d.xLoc},${d.yLoc}`;
    const visitCount = visitsByParticipantAndLocation.get(key);
    const totalMinutes = visitCount * 5;
    const minutes = totalMinutes % 60;
    const hours = (totalMinutes - minutes) / 60;

    return `
      <div>
        <strong>Timestamp:</strong> ${d.timestamp}<br>
        <strong>Location:</strong> (${d.xLoc}, ${d.yLoc})<br>
        <strong>Participant ID:</strong> ${d.participantId}<br>
        <strong>Cummulative Time Spent:</strong> ${hours ? hours : "0"}H ${minutes ? minutes : "0"}M<br>
      </div>
    `;
}

function getTooltipHtml2(d, visitsBySquare, maxParticipantsBySquare) {
    const squareKey = `${d.x},${d.y}`;
    const totalVisits = visitsBySquare.get(squareKey);
    const maxParticipants = maxParticipantsBySquare.get(squareKey);
    const totalMinutes = totalVisits * 5;
    const minutes = totalMinutes % 60;
    const hours = (totalMinutes - minutes) / 60;
  
    return `
      <div>
        <strong>Location:</strong> (${d.x}, ${d.y}) - (${d.x + squareSize}, ${d.y + squareSize})<br>
        <strong>Cummulative Time Spent:</strong> ${hours ? hours : "0"}H ${minutes ? minutes : "0"}M<br>
        <strong>Participants:</strong> ${maxParticipants ? maxParticipants : "N/A"}<br>
      </div>
    `;
}


/* ******************************************************
* Processing Data                                       *
****************************************************** */
function processData(data) {
    const visitsByParticipantAndLocation = new Map();
  
    data.forEach((d, i) => {
        const key = `${d.participantId},${d.xLoc},${d.yLoc}`;
        visitsByParticipantAndLocation.set(key, (visitsByParticipantAndLocation.get(key) || 0) + 1);
    });
  
    return visitsByParticipantAndLocation;
}
 
function processData2(data, squareSize) {
    const visitsBySquare = new Map();
    const maxParticipantsBySquare = new Map();
    const participantsBySquareAndTimestamp = new Map();
  
    data.forEach((d) => {
        const squareX = Math.floor(d.xLoc / squareSize) * squareSize;
        const squareY = Math.floor(d.yLoc / squareSize) * squareSize;
        const squareKey = `${squareX},${squareY}`;
        const timestampSquareKey = `${d.timestamp},${squareX},${squareY}`;
        visitsBySquare.set(squareKey, (visitsBySquare.get(squareKey) || 0) + 1);
    
        participantsBySquareAndTimestamp.set(timestampSquareKey, (participantsBySquareAndTimestamp.get(timestampSquareKey) || new Set()).add(d.participantId));
    
        const currentMax = maxParticipantsBySquare.get(squareKey) || 0;
        maxParticipantsBySquare.set(squareKey, Math.max(currentMax, participantsBySquareAndTimestamp.get(timestampSquareKey).size));
    });
    
    return { visitsBySquare, maxParticipantsBySquare };
}

function computeData(data){
    congestionByLocation = new Map();
    data.forEach(d => {
        const key = `${d.xLoc},${d.yLoc}`;
        congestionByLocation.set(key, (congestionByLocation.get(key) || 0) + 1);
    });
    maxCongestion = Math.max(...Array.from(congestionByLocation.values()));

    var squareData = processData2(data, squareSize);
    visitsBySquare = squareData.visitsBySquare;
    maxParticipantsBySquare = squareData.maxParticipantsBySquare;
    maxSquareVisits = Math.max(...Array.from(visitsBySquare.values()));

    // Prints for testing
    // console.log(maxCongestion);
    // console.log(maxSquareVisits);
}

function computeDailyMaxesAtTimestamp(data){
    data.forEach(d => {
        var sqrData = processData2(d, squareSize);
        maxDailySquareVisits = Math.max(maxDailySquareVisits, Math.max(...Array.from(sqrData.visitsBySquare.values())));
    });
}

function parseDataDate(data){
    for(var j = 0; j< 288;j++){
        current_data[j] = new Array()
        for(var i = 0; i < numberOfParticipants+1; i++){
            current_data[j].push(data[i +(numberOfParticipants+1)*j])
        }
    }

}


/* ******************************************************
* Update Slider                                         *
****************************************************** */
function updateSlider(){
    slider = document.getElementById("myRange");
    hours = Math.floor(slider.value*5 / 60);
    minutes = slider.value*5 % 60;
    minuteOutput = $("#minutes")[0];
    hourOutput = $("#hours")[0];
    hourOutput.innerHTML = hours;
    minuteOutput.innerHTML = minutes;
    if(minutes < 10){
        minuteOutput.innerHTML = "0"+minutes;
        minutes = "0"+minutes;
    }
    else {
        minuteOutput.innerHTML = minutes;
    }
    if(hours < 10){
        hourOutput.innerHTML = "0"+hours;
        hours = "0"+hours
    }
    else {
        hourOutput.innerHTML = hours;
    }
    currentTime = hours + ":" + minutes

    for(var i = 0; i < current_data.length; i++){
        if(current_data[i][0].time == currentTime){
            data = current_data[i] 
        }
    }
    computeData(data);
    drawBottleneck();
}


/* ******************************************************
* Charts Logic                                          *
****************************************************** */
function drawMap(selected_svg){
    selected_svg.selectAll("path")
        .data(city_map)
        .enter()
        .append("path")
        .attr("fill", function(d){
            if(d.buildingtype == "Residental"){
                return "Lightgrey"
            }
            else if(d.buildingtype == "Commercial"){
                return "#61b7ac"
            }
            else{
                return "Brown"
            }
        })
        .attr("d", d3.geoPath().projection(scale()))
        .attr("opacity", 0.7)
        .style("stroke-width", "1px")
        .style("stroke", "Grey");
}

function drawBottleneck() {
    uniqueSquareKeys = Array.from(visitsBySquare.keys());
    uniqueSquares = uniqueSquareKeys.map(key => {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
    });

    const heatmapRects = bottleneck_content.selectAll(".heatmap-rect")
        .data(uniqueSquares, d => `${d.x},${d.y}`);

    heatmapRects.join(
        enter => enter.append("rect")
            .attr("class", "heatmap-rect")
            .attr("x", d => xScale(d.x))
            .attr("y", d => yScale(d.y) - (yScale(0) - yScale(squareSize)))
            .attr("width", xScale(squareSize) - xScale(0))
            .attr("height", yScale(0) - yScale(squareSize))
            .attr("fill", d => {
                const key = `${d.x},${d.y}`;
                return customColorScale(visitsBySquare.get(key) / maxDailySquareVisits);
            })
            .attr("opacity", 0.8)
            .on("mouseover", function (event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                tooltip.html(getTooltipHtml2(d, visitsBySquare, maxParticipantsBySquare))
                    .style("left", event.pageX + 15 + "px")
                    .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", function () {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", function (event, d) {
                // Add some functionality here
                console.log("Clicked data point:", d);
            }),
        update => update
            .attr("fill", d => {
                const key = `${d.x},${d.y}`;
                return customColorScale(visitsBySquare.get(key) / maxDailySquareVisits);
            }),
        exit => exit.remove()
    );

    d3.select("#bottlenecks_title")
        .text("Bottlenecks");

    console.log("Bottleneck Drawn");
}

 
/* ******************************************************
* Scale                                                 *
****************************************************** */
function scale () {
    return d3.geoTransform({
        point: function(x, y) {
            this.stream.point(xScale(x), yScale(y));
        }
    });
}


/* ******************************************************
* Legend                                                *
****************************************************** */
let legendCreated = false;

function addLegend() {
    if (!legendCreated) {
        const legend = bottleneck_svg.append("g")
            .attr("transform", `translate(${width_1 - 180},${margin_1.top})`);

        const legendTitle = legend.append("text")
            .attr("class", "legend-title")
            .attr("x", 0)
            .attr("y", -10)
            .text("Number of Participants");

        legendCreated = true;
    }

    const legendData = [
        { color: customColorScale(0.15), range: [0, 0.3 * maxDailySquareVisits] },
        { color: customColorScale(0.45), range: [0.3 * maxDailySquareVisits + 1, 0.6 * maxDailySquareVisits] },
        { color: customColorScale(0.75), range: [0.6 * maxDailySquareVisits + 1, maxDailySquareVisits] }
    ];

    const legendItems = bottleneck_svg.selectAll(".legend-item")
        .data(legendData)
        .join("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(${width_1 - 180},${margin_1.top + i * 25})`);

    legendItems.selectAll("rect")
        .data(d => [d])
        .join("rect")
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", d => d.color);

    legendItems.selectAll("text")
        .data(d => [d])
        .join("text")
        .attr("x", 25)
        .attr("y", 15)
        .text(d => `${Math.round(d.range[0])} to ${Math.round(d.range[1])}`);

    legendItems
        .on("mouseover", function (event, legendItemData) {
            const [minRange, maxRange] = legendItemData.range.map(val => Math.round(val));

            bottleneck_content.selectAll(".heatmap-rect")
                .attr("opacity", d => {
                    const participants = maxParticipantsBySquare.get(`${d.x},${d.y}`);
                    return (participants >= minRange && participants <= maxRange) ? 1 : 0.2;
                });

            legendItems
                .filter(d => d !== legendItemData)
                .attr("opacity", 0.2);
        })
        .on("mouseout", function () {
            bottleneck_content.selectAll(".heatmap-rect")
                .attr("opacity", 0.8);

            legendItems
                .attr("opacity", 1);
        });
}



/* ******************************************************
* Zoom                                                  *
****************************************************** */
function createZoomBehavior(svg, content) {
    const zoom = d3.zoom()
        .scaleExtent([1, 10]) // Adjust this array to set the minimum and maximum zoom levels
        .on("zoom", (event) => {
            content.attr("transform", event.transform);
        });

    svg.call(zoom);
}
