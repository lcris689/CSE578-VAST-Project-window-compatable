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
* Lasso Map & POI Variables        *
************************************/
const squareSize = 200;
const poi_granularity = 0.10;
var poi_svg, lasso_svg, ActivityLogsData, poi_data;
var circles, squares, uniqueSquares, uniqueSquareKeys, 
    tooltip, maxSquareVisitsconst, visitsBySquare, 
    maxParticipantsBySquare, maxParticipantVisits, 
    visitsByParticipantAndLocation, maxCongestion, 
    congestionByLocation, poi_content, circleClicked = false,
    selectedParticipants;
var maxDailySquareVisits = 0;

/************************************
* Data Formatting                   *
************************************/
var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
var formatTime = d3.timeFormat("%H:%M")

/************************************
* Color Scales                      *
************************************/
const colorScale = d3.scaleSequential(d3.interpolateReds).domain([0.15, 1])
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
    poi_svg = d3
        .select("#chart-svg")
        .attr("width", width_1 + margin_1.left + margin_1.right)
        .attr("height", height_1 + margin_1.top + margin_1.bottom);

    lasso_svg = d3
        .select("#lasso-svg")
        .attr("width", width_1 + margin_1.left + margin_1.right)
        .attr("height", height_1 + margin_1.top + margin_1.bottom);


    poi_content = poi_svg.append("g");

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

        drawMap(lasso_svg);
        drawMap(poi_content);

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
            d.participantID = +d.participantID
        });
        ActivityLogsData = data[0];

        console.log("Drawing for date: ", date)

        visitsByParticipantAndLocation = processData(ActivityLogsData);
        maxParticipantVisits = Math.max(...Array.from(visitsByParticipantAndLocation.values()));

        parseDataDate(ActivityLogsData);
        updateSlider();
        drawPointsOfInterest(selectedParticipants);
        createZoomBehavior(poi_svg, poi_content);
        
    });

}


/* ******************************************************
* Tooltips                                              *
****************************************************** */
function getTooltipHtml(d, visitsByParticipantAndLocation) {
    const key = `${d.participantID},${d.xLoc},${d.yLoc}`;
    const visitCount = visitsByParticipantAndLocation.get(key);
    const totalMinutes = visitCount * 5;
    const minutes = totalMinutes % 60;
    const hours = (totalMinutes - minutes) / 60;

    return `
      <div>
        <strong>Timestamp:</strong> ${d.timestamp}<br>
        <strong>Location:</strong> (${d.xLoc}, ${d.yLoc})<br>
        <strong>Participant ID:</strong> ${d.participantID}<br>
        <strong>Cummulative Time Spent:</strong> ${hours ? hours : "0"}H ${minutes ? minutes : "0"}M<br>
      </div>
    `;
}


/* ******************************************************
* Processing Data                                       *
****************************************************** */
function processData(data) {
    const visitsByParticipantAndLocation = new Map();
  
    data.forEach((d, i) => {
        const key = `${d.participantID},${d.xLoc},${d.yLoc}`;
        visitsByParticipantAndLocation.set(key, (visitsByParticipantAndLocation.get(key) || 0) + 1);
    });
  
    return visitsByParticipantAndLocation;
}

function parseDataDate(data){
    for(var j = 0; j< 288;j++){
        current_data[j] = new Array()
        for(var i = 0; i < numberOfParticipants+1; i++){
            current_data[j].push(data[i +(numberOfParticipants+1)*j])
        }
    }
}

function filterDataByParticipant(data, pSelected){
    if (pSelected == null || pSelected.length == 0) return [];
    var fData;

    // Filter data based on the participantIds in pSelected
    fData = data.filter(function (row) {
        return pSelected.includes(row.participantID);
    });

    return fData
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
            break;
        }
    }
    drawLassoMap(data);
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


function drawLassoMap(data){
    var circles = lasso_svg.selectAll("circle")
        .data(data, d=>d.participantID)
        .join(
            enter => enter.append("circle")
                .attr("class", "circle")
                .attr("id", (d) => {
                    return "dot-" + d.participantID;
                })
                .attr("cx", d=>xScale(d.xLoc))
                .attr("cy", d=>yScale(d.yLoc))
                .attr("r", 4)
                .attr('fill', "steelblue")
                .attr('stroke', 'black')
                .attr("stroke-width", 0.5)
                .on('mouseover', function(event,d){
                    console.log(d)
                }),
            update => update.call(update => update.transition()
                .duration(1000)
                .attr("cx", d=>xScale(d.xLoc))
                .attr("cy", d=>yScale(d.yLoc)))
        );
    
    
    let coords = [];
    const lineGenerator = d3.line();

    const pointInPolygon = function (point, vs) {
        var x = point[0],
            y = point[1];

        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i][0],
                yi = vs[i][1];
            var xj = vs[j][0],
                yj = vs[j][1];

            var intersect =
                yi > y != yj > y &&
                x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }

        return inside;
    };

    function drawPath() {
        d3.select("#lasso")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .style("fill", "#00000054")
            .attr("d", lineGenerator(coords));
    }

    function dragStart() {
        coords = [];
        circles.attr("fill", "steelblue").attr("r",4);
        d3.select("#lasso").remove();
        lasso_svg
            .append("path")
            .attr("id", "lasso");
    }

    function dragMove(event) {
        let mouseX = event.sourceEvent.offsetX - margin_1.left;
        let mouseY = event.sourceEvent.offsetY - margin_1.top;
        coords.push([mouseX, mouseY]);
        drawPath();
    }

    function dragEnd() {
        let selectedDots = [];
        circles.each((d, i) => {
            let point = [
                xScale(d.xLoc),
                yScale(d.yLoc),
            ];
            if (pointInPolygon(point, coords)) {
                d3.select("#dot-" + d.participantID).attr("fill", "red").attr("r",4.5);
                selectedDots.push(d.participantID);
                dataSelected.push([])
            }
            
        });
        console.log('select: ', selectedDots);
        selectedParticipants = selectedDots
        drawPointsOfInterest(selectedParticipants);
        d3.select("#lasso").remove();
    }

    const drag = d3
        .drag()
        .on("start", dragStart)
        .on("drag", dragMove)
        .on("end", dragEnd);

        lasso_svg.call(drag); 

    d3.select("#lasso_title")
        .text("Map Viz");
}


function drawPointsOfInterest(participants) {
    if (participants == null || participants.length == 0) {
        d3.select("#poi_title")
            .text("Select Points to Draw");
    }
    else {
        d3.select("#poi_title")
        .text("Loading...");
    }

    var filteredData = filterDataByParticipant(ActivityLogsData, participants);

    // Remove duplicates based on participantID, xLoc, and yLoc
    var uniqueData = [...new Map(filteredData.map(d => [`${d.participantID},${d.xLoc},${d.yLoc}`, d])).values()];

    // Sort the unique data in descending order and keep only the top 100 elements
    /* uniqueData.sort((a, b) => (visitsByParticipantAndLocation.get(`${b.participantID},${b.xLoc},${b.yLoc}`) / maxParticipantVisits) - (visitsByParticipantAndLocation.get(`${a.participantID},${a.xLoc},${a.yLoc}`) / maxParticipantVisits));
    uniqueData = uniqueData.slice(0, 100);
    console.log("Filtered & Sorted:", uniqueData); */
    
    console.log("Size: ", uniqueData.length)

    // Bind the filtered data to the circles
    var circles = poi_content.selectAll("circle")
        .data(uniqueData, d => d.participantID); // Add key function to keep track of participantID

    // Update existing circles
    circles.attr("opacity", 0.8);

    // Add new circles
    circles.enter()
        .filter(d => (visitsByParticipantAndLocation.get(`${d.participantID},${d.xLoc},${d.yLoc}`) / maxParticipantVisits) >= poi_granularity)
        .append("circle")
        .attr("cx", d => xScale(d.xLoc))
        .attr("cy", d => yScale(d.yLoc))
        .attr("r", d => 25 * (visitsByParticipantAndLocation.get(`${d.participantID},${d.xLoc},${d.yLoc}`) / maxParticipantVisits))
        .attr("fill", d => colorScale(visitsByParticipantAndLocation.get(`${d.participantID},${d.xLoc},${d.yLoc}`) / maxParticipantVisits))
        .attr('stroke', 'black')
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.8)
        .on("mouseover", function (event, d) {
            console.log("Clicked: ", circleClicked)
            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            tooltip.html(getTooltipHtml(d, visitsByParticipantAndLocation))
                .style("left", event.pageX + 15 + "px")
                .style("top", event.pageY - 28 + "px");

            if (!circleClicked) {
                poi_content.selectAll("circle").attr("opacity", d2 => d2.participantID === d.participantID ? 1 : 0);
            }
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);

            if (!circleClicked) {
                poi_content.selectAll("circle").attr("opacity", 0.8);
            }
        })
        .on("click", function (event, d) {
            circleClicked = true;
            poi_content.selectAll("circle").attr("opacity", 0.8);
            poi_content.selectAll("circle").attr("opacity", d2 => d2.participantID === d.participantID ? 1 : 0);
        });
    
        // Add an onClick event listener to the SVG to reset the opacity when clicking outside the circles
        poi_svg.on("click", function(event) {
            if (event.target.tagName !== "circle") {
                circleClicked = false;
                poi_content.selectAll("circle").attr("opacity", 0.8);
            }
        });

    // Remove circles for participants that are no longer selected
    circles.exit().remove();

    console.log(circles);

    if (participants != null && participants.length > 0) {
        d3.select("#poi_title")
            .text("Points of Interest");
    }
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